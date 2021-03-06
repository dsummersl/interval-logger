var intervalLogger = require('../src/intervalLogger.js');
var expect = require('chai').expect;
var sinon = require('sinon');

describe('intervalLogger', function() {
  'use strict';
  var clock, reportStub;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
    reportStub = sinon.stub();
  });

  afterEach(function() {
    clock.restore();
  });

  it('will not log a 0 count on no data', function() {
    var logger = intervalLogger.create('test',reportStub);
    clock.tick(1100);
    expect(reportStub.called).to.equal(false);
  });

  it('will log if a key is set', function() {
    var logger = intervalLogger.create('test',reportStub);
    logger.increment('a');
    clock.tick(1100);
    expect(reportStub.callCount).to.equal(1);
    expect(reportStub.withArgs('test',{'a': 1}).callCount).to.equal(1);
  });

  it('increments a "count" subkey if no key is provided', function() {
    var logger = intervalLogger.create('test', reportStub);
    logger.increment();
    clock.tick(1100);
    expect(reportStub.callCount).to.equal(1);
    expect(reportStub.withArgs('test',{'count': 1}).callCount).to.equal(1);
  });

  it('resets counts after the interval', function() {
    var logger = intervalLogger.create('test',reportStub);
    logger.increment();
    clock.tick(5000);
    expect(reportStub.callCount).to.equal(1);
    expect(logger.subkeys).to.deep.equal({ 'count': NaN });
  });

  it('respects intervalMS parameter', function() {
    var logger = intervalLogger.create('test',reportStub,100);
    logger.increment();
    clock.tick(101);
    expect(reportStub.callCount).to.equal(1);
    logger.increment();
    clock.tick(101);
    expect(reportStub.callCount).to.equal(2);
    expect(reportStub.getCall(1).args).to.deep.equal(['test',{'count': 1}]);
  });

  it('will report null for known subkeys when none have been reported', function() {
    var logger = intervalLogger.create('test',reportStub,100,true);
    logger.increment();
    clock.tick(101);
    expect(reportStub.getCall(0).args).to.deep.equal(['test',{'count':1}]);
    clock.tick(101);
    expect(reportStub.callCount).to.equal(2);
    expect(reportStub.getCall(1).args).to.deep.equal(['test',{'count': NaN}]);
  });

  it('statistics() computes the stats on a #', function() {
    var logger = intervalLogger.create('test',reportStub);
    logger.statistics('a',10);
    clock.tick(1100);
    expect(reportStub.callCount).to.equal(1);
    expect(reportStub.withArgs('test',{
      'a.count': 1,
      'a.variance': 0,
      'a.std': 0,
      'a.average': 10
    }).callCount).to.equal(1);

    logger.statistics('a',10);
    logger.statistics('a',90);
    clock.tick(1100);
    expect(reportStub.callCount).to.equal(2);
    expect(reportStub.withArgs('test',{
      'a.count': 2,
      'a.variance': 3200,
      'a.std': 56.568542494923804,
      'a.average': 50
    }).callCount).to.equal(1);
  });
});
