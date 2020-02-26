const os = require('os');
const { exec } = require('child_process');
    
module.exports = function(opts){
    var Logio          = require('./winston-logio');
    var logio = process.logio = new Logio(opts)
    opts.winston.addTransport(logio)

    // start logio server if exists
    var server = '/node_modules/.bin/log.io-server'
    if( require('fs').existsSync(process.cwd()+server) )
        exec(`.${server}`)

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