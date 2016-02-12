Interval Logger
===============

A generic class that reports aggregate key/value data over a specific interval.
This is useful for high volume metrics that need some aggregation (over time) to
minimize network traffic, say.

Two functions are supported:
 * `increment(key)`: increment a key, and report its sum over the interval
   (reset to 0 after the intervel). For computing hit-count events.
 * `statistics(key,value)`: compute running statistics of values for a key.
   Computes count, average, standard deviation, and variance. For computing
   gauge data types (response time, etc).

[![build status](https://secure.travis-ci.org/dsummersl/interval-logger.png)](http://travis-ci.org/dsummersl/interval-logger)

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

    ilog.statistics('bar',Math.random())
    // after another second, "test: bar.count=1 bar.average=0.433123948 bar.std=0.0 bar.variance=0.0"

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
    ilog.statistics('foo',Math.random())
