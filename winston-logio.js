/*
 *
 * (C) 2013 Jaakko Suutarla
 * MIT LICENCE
 *
 */
var runpath = process.cwd()+'/node_modules/'
const Transport = require( runpath+'winston-transport');

var net = require('net'),
    util = require('util'),
    os = require('os'),
    winston = require(runpath+'winston');

module.exports = class Logio extends Transport {
  constructor(options){
    options = options || {};
    super()
    
    this.name       = options.name || 'logio';
    this.localhost  = options.localhost || os.hostname();
    this.host       = options.host || '127.0.0.1';
    this.port       = options.port || 28777;
    this.node_name  = options.node_name || process.title;
    this.pid        = options.pid || process.pid;
    
    // Connection state
    this.log_queue = [];
    this.connected = false;
    this.socket = null;
    this.retries = 0;
    this.inputs = {}

    // Protocol definition
    this.delimiter = "\0";//\r\n';
    console.log("logio transport inited")
    this.connect();
  }

    
  log(info,callback){
    var self = this
    setImmediate( () => {
      var events = []
      // Log format
      events.push([
        '+msg',
        self.host,
        info.stream || self.node_name,
        info.level+': '+info.message
      ])
      
      if (!self.connected) {
        if( self.log_queue.length < 100 ) return // dont flood
        events.map( (event) => {
          self.log_queue.push({
            message: event,
            callback: function () {
              self.emit('logged');
              callback(null, true);
            }
          })
        })
      } else {
        events.map( (event) => {
          self.sendLog(event, function () {
            self.emit('logged');
            if( callback ) callback(null, true);
          })
        })
      }
    })

  };

  connect() {
    var self = this;
    this.socket = new net.Socket();

    this.socket.on('error', function (err) {
      self.connected = false;
      self.error = true
      self.socket.destroy();
      console.error(err)

      if (self.retries < 3) {
        self.retries++;

        setTimeout(function () {
          self.connect();
        }, 100);
      } else {
        self.log_queue = [];
        self.silent = true;
        setTimeout(function() {
          self.retries = 0;
          self.silent = false;
          self.connect();
        }, 5000);
      }
    });

    this.socket.on('timeout', function() {
      if (self.socket.readyState !== 'open') {
        self.socket.destroy();
      }
    });

    this.socket.on('close', function () {
      self.connected = false;
      if (self.error == false) {
        self.connect();
      } else {
        self.error = true;
      }

    });

    this.socket.connect(self.port, self.host, function () {
      console.log("logio connected")
      self.announce();
    });
  };

  announce() {
    var self = this;
    //var msg = '+input|' + self.node_name +'|'+ self.host 
    //self.socket.write(msg+self.delimiter);
    self.connected = true;
    self.flush();
  };

  flush() {
    var self = this;

    for (var i = 0; i < self.log_queue.length; i++) {
      self.sendLog(self.log_queue[i].message, self.log_queue[i].callback);
      self.emit('logged');
    }
    self.log_queue.length = 0;
  };

  sendLog(message, callback) {
    var self = this,
        log_message = message.join('|') + self.delimiter;

    self.socket.write(log_message);
    callback();
  }
}
















