![](https://github.com/coderofsalvation/express-logio/raw/master/screenshot.gif)

Thanks to the nifty standalone [log.io](https://npmjs.com/log.io) package you can easily view events (which should not be sent to internet)

## Usage

```javascript
app.use( require('express-logio')({
  winston: require('winston'),
  port:6689,
  node_name: 'backend',
  host: '127.0.0.1',
  forwardConsole:true
}))

// now surf your browser to: http://localhost:6688

// output to log.io 'backend' stream
console.log("hello default")
// output to log.io 'mystream' stream
console.log("this is a test",{steam:"mystream"})
```

> Now surf to http://localhost:6688

cpu, memory and http-requests are logged automatically.

> NOTE 1: log.io-receiver runs on port 6689, but the webserver runs on 6688 (see [log.io](https://npmjs.com/log.io))
> NOTE 2: Parse-server users: see parse-server section

## Install

    npm install express-logio log.io winston --save

> NOTE: leave out winston if you're already using it in your express app

## Options

  winston: require('winston')  // your winston logger
  port:6689,                   // default log.io port
  node_name: 'backend',        // default name
  host: '127.0.0.1',           // host ip
  forwardConsole:true          // forwards console.log e.g. to log.io
}))


## Parse-server

Pass the parse logger like this:

```javascript
var {logger} = require('parse-server')

app.use( require('express-logio')({
  winston: logger.adapter,
  ...
}))
```

## FAQ

* where are the logfile(s)?

There aren't.
Check the [log.io](https://npmjs.com/log.io) docs to add logfiles as well.