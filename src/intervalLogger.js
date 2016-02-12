var _ = require("lodash");

var DEFAULT_INTERVAL_MS = 1000;

/////////////////////////////////////////////////////////////////////////////////
//                                 CountLogger                                 //
/////////////////////////////////////////////////////////////////////////////////

// A class to send summary stats to graphite server at regular intervals.
//
// Parameters:
//   metric     = Name of the main metric.
//   reportZeros = if true, report 0s otherwise don't.
//   intervalMS = How often to report the metric.
//   callback   = A 'report' callback. If not provided send to console.log. Called
//                with two parameters: the metric name and a dictionary of keys
//                to counts that were recorded.
function CountLogger(metric, reportZeros, intervalMS, callback) {
  'use strict';
  this.subkeys = {};
  this.metric = metric;
  this.reportZeros = reportZeros;
  this.callback = callback;
  var self = this;
  var resetFn = function() {
    self._send();
    _.forEach(self.subkeys,function(v) {
      self.subkeys[v] = NaN;
    });
  };
  resetFn();
  this.intervalId = setInterval(resetFn,intervalMS);
}

CountLogger.prototype.stopInterval = function() {
  'use strict';
  clearInterval(this.intervalId);
};

CountLogger.prototype._send = function() {
  'use strict';
  var dataToSend = _.cloneDeep(this.subkeys);
  if (this.reportZeros) {
    this.callback(this.metric, dataToSend);
    return;
  }

  dataToSend = _.pickBy(dataToSend, _.isNumber);
  if (_.keys(dataToSend).length === 0) {
    return;
  }

  this.callback(this.metric, dataToSend);
};

// Increment the count.
//
// In hostedgraphite you can get accurate numbers on your graphs by using the
// :sum aggregation (http://docs.hostedgraphite.com/advanced/aggregations.html).
//
// If you have a metric "test" then you could show a graph of every second of
// traffic across all hosts with the following query:
//
//     # The .* is because send_env is used so the key is test.count.DARKROLL_ENV
//     summarize(test.count.*:sum,"1s","sum")
//     # Would show any calls to new CountLogger("test").increment().
//
// Parameters:
//   subkey = Appended to the main metric name (default "count").
//   count  = Amount to increment by (default 1).
CountLogger.prototype.increment = function(subkey,count) {
  'use strict';
  var addition = 1;
  var target = subkey;
  if (!subkey) {
    target = 'count';
  }
  if (isFinite(count)) {
    addition = count;
  }
  if (!_.has(this.subkeys,target)) {
    this.subkeys[target] = 0;
  }
  this.subkeys[target] += addition;
};


// Set a value that should be reported as an average.
//
// The average of all the values reported over the interval that this logger
// will be reported.
//
// Useful for gauge like things (number of active requests at the moment, etc),
// rather than events (increment is better for that).
CountLogger.prototype.average = function(subkey, value) {
  'use strict';
};

/////////////////////////////////////////////////////////////////////////////////
//                                  Factories                                  //
/////////////////////////////////////////////////////////////////////////////////

// Create a new logger.
//
// Parameters:
//   metric: The top level graphite key to store.
//   reporter: A 'report' callback. If not provided send to console.log. Called
//             with two parameters: the metric name and a dictionary of keys
//             that were sent to graphite.
//   reportZeros = if true, report 0s otherwise don't.
//
// Returns a logger.
module.exports.create = function(metric,reporter,reportZeros) {
  'use strict';
  return new CountLogger(metric, reportZeros, DEFAULT_INTERVAL_MS, reporter);
};
