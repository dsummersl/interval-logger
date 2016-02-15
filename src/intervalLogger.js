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
  this.subkeyData = {};
  this.metric = metric;
  this.reportZeros = reportZeros;
  this.callback = callback;
  var self = this;
  var resetFn = function() {
    self._send();
    _.forEach(_.keys(self.subkeys),function(v) {
      self.subkeys[v] = NaN;
    });
  };
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

  dataToSend = _.omitBy(dataToSend, _.isNaN);
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
  if (!_.has(this.subkeys,target) || _.isNaN(this.subkeys[target])) {
    this.subkeys[target] = 0;
  }
  this.subkeys[target] += addition;
};

// Set a value that should have statistics calculated on it (average, std, etc)
//
// Useful for gauge like things (number of active requests at the moment, etc),
// rather than events (increment is better for that).
//
// Creates the following values based on the 'subkey':
//  subkey.count    = number of times this subkey was called in the interval
//                    (eg, number of numbers).
//  subkey.average  = the average of the numbers in the interval.
//  subkey.std      = standard deviation of the numbers.
//  subkey.variance = variance of the numbers.
CountLogger.prototype.statistics = function(subkey, value) {
  'use strict';
  if (!this.subkeys[subkey +'.count']) {
    this.subkeys[subkey +'.count'] = 0;
  }

  // See Knuth TAOCP vol 2, 3rd edition, page 232 -- running stats.
  var n = ++this.subkeys[subkey +'.count'];
  var oldM, newM, oldS, newS;

  if (n === 1) {
    oldM = newM = value;
    oldS = newS = 0.0;
  } else {
    oldM = this.subkeyData[subkey +'.M'];
    oldS = this.subkeyData[subkey +'.S'];

    newM = oldM + (value - oldM)/n;
    newS = oldS + (value - oldM)*(value - newM);
  }

  // next iteration
  this.subkeyData[subkey +'.M'] = oldM;
  this.subkeyData[subkey +'.S'] = oldS;

  this.subkeys[subkey +'.average'] = newM;
  this.subkeys[subkey +'.variance'] = (n > 1) ? newS/(n - 1): 0.0;
  this.subkeys[subkey +'.std'] = Math.sqrt(this.subkeys[subkey +'.variance']);
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
//   intervalMS = Number of milliseconds between aggregations (in ms).
//   reportZeros = if true, report 0s otherwise don't.
//
// Returns a logger.
module.exports.create = function(metric,reporter,intervalMS,reportZeros) {
  'use strict';
  if (!reporter) {
    reporter = function(metric, values) {
      var values = _.map(values, function(v,k) { return k +'='+ v });
      console.log(metric +': '+ values.join(', '));
    };
  }
  return new CountLogger(metric, reportZeros, intervalMS || DEFAULT_INTERVAL_MS, reporter);
};
