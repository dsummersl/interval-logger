Interval Logger
===============

A generic class that reports aggregate key/value data over a specific interval.
This is useful for high volume metrics that need some aggregation (over time) to
minimize network traffic, say.

Build & Test
------------

Tests are written in mocha.

Use npm:

    npm test

Example
-------

Several defaults are provided. Reports are sent to the console if no callback is
specified:

    var intervalLogger = require('intervalLogger');
    var ilog = intervalLogger.create('example');

    ilog.increment();
    // after 1 second, "test: count=1" is logged to the console.

    ilog.increment('foo');
    ilog.increment('foo',2);
    // after 1 second, "test: foo=3" is logged to the console.

    // if you want to report ALL keys every second even if they haven't been
    // incremented:
    intervalLogger = require('intervalLogger',null,true);
    ilog.increment();
    // after 1 second, "test: count=1" is logged to the console.
    // after 2 seconds, "test: count=NaN" is logged to the console.

    // cleanup
    ilog.stopInterval();

Primarily though this is intended to tie into some external logging or logging
service (say graphite, newrelic, bunyan or the like):

    var intervalLogger = require('intervalLogger');
    var ilog = intervalLogger.create('example',function(metric, values) {
      // after 1 second...
      //   metric='example'
      //   values={'count': 1}

      // ...send this valuable information to someone important...
    });

    ilog.increment();
