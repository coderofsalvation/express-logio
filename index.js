const os = require('os');
const runpath       = process.cwd()
const { exec }      = require('child_process');
const stringReplace = require('string-replace-middleware');
var logioServer     = runpath+'/node_modules/.bin/log.io-server'
const { createProxyMiddleware } = require('http-proxy-middleware');

function startServers(opts){
    var app = opts.app
    if( !require('fs').existsSync(logioServer) ) return
    var p = exec( logioServer )
    if( process.env.DEBUG ) p.stdout.pipe(process.stdout)
    p.stderr.pipe(process.stderr)

    // prepare proper cleanup to prevent duplicate servers
    var signals = ['exit','SIGHUP','SIGINT','SIGUSR1','SIGUSR2']
    signals.map( (s) => {
        process.on(s, function(pid){
            console.log(`killing log.io server (pid ${pid})`)
            try{ process.kill(pid) }catch(e){}
            process.exit()
        }.bind(null,p.pid))
    })
    
    // rewrite some urls
    var replacer = stringReplace({
        '/static/css/main.a679e7ff.chunk.css': '/log/static/css/main.a679e7ff.chunk.css',
        '/static/js/2.3a236868.chunk.js':      '/log/static/js/2.3a236868.chunk.js',
        '/static/js/main.b8e0f2d6.chunk.js':   '/log/static/js/main.b8e0f2d6.chunk.js',
        '/socket.io':'/log/socket.io'
    })

    app.use( (req,res,next) => {
        var logReferer = req.headers.referer && req.headers.referer.match(/\/log/)
        var logUrl     = req.url.match(/^\/log/)
        if( logReferer || logUrl ) return replacer(req,res,next)
        next()
    })

    // proxy to logio webserver
    app.use( opts.url, createProxyMiddleware({ 
        target: 'http://localhost:'+opts.webport,
        ws:true,
        pathRewrite: {
            '^/log': '/' 
        }
    }))
}

module.exports = function(opts){
    var requiredProps  = ['app','winston','host','port','node_name']
    for( var i in requiredProps ) 
        if( !opts[requiredProps[i]] ) 
            throw requiredProps[i]+' not found in express-logio opts'
    var Logio = require('./winston-logio');
    var logio = process.logio = new Logio(opts)
    opts.winston.addTransport(logio)

    // start logio server
    startServers(opts)
    
    // forward console functions if needed
    if( opts.forwardConsole ){
        var levels = {
            log:"info",
            error:"error",
            warn:"warning"
        }
        for( var i in levels){
            var level = levels[i]
            console[i] = function(level,old,message,opts){
                old(message)
                opts = opts || typeof opts == 'object' ? opts : {}
                if( level == 'error' ) opts.stream = 'error'
                logio.log({level,message,...opts})
            }.bind(console,level,console[i])
        }      
    }
    
    const drawBar = (total,used,char) => {
        var chars     = 100
        var str       = ''
        var size      = total
        var ratio     = chars/total
        var usedchars = Math.round(ratio*used);
        for( var i = 0; i < usedchars;       i++ ) str+=char
        str += ` `+usedchars+'%'
        return str
    }
    
    setInterval( () => {
      var load    = Math.round(os.loadavg()[0])
      var mem     = process.memoryUsage()
      logio.log({level:"info",message:drawBar(100,load,'█')+' cpu',stream:"cpu        "})
      logio.log({level:"info",message:drawBar(mem.rss+mem.heapTotal,mem.heapUsed,'▒')+' mem',stream:"memory"})
    },2000)
 
    return function(req,res,next){
        try{
            process.logio.log({level:"info",message:req.method+" "+req.url,stream:"http"})
        }catch(e){}
        next()
    }
}