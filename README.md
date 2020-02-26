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

// output to log.io 'backend' stream
console.log("hello default")
// output to log.io 'mystream' stream
console.log("this is a test",{steam:"mystream"})
```

> Now surf to http://localhost:6688

cpu, memory and http-requests are logged automatically.
The difference between port 6689 and 6688 can be read  in the [log.io docs](https://npmjs.com/log.io)

> NOTE: Parse-server users: see parse-server section below

## Install

    npm install express-logio log.io winston --save

> NOTE: leave out winston if you're already using it in your express app

## Options

```javascript
{
  winston: require('winston')  // your winston logger
  port:6689,                   // default log.io port
  node_name: 'backend',        // default name
  host: '127.0.0.1',           // host ip
  forwardConsole:true          // forwards console.log e.g. to log.io
}
```


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