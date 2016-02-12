var intervalLogger = require('../src/intervalLogger.js');
var expect = require('chai').expect;
var sinon = require("sinon");

describe("intervalLogger", function() {
  'use strict';
	var clock, reportStub;

	beforeEach(function() {
		clock = sinon.useFakeTimers();
		reportStub = sinon.stub();
	});

	afterEach(function() {
		clock.restore();
	});

	it("won't log a 0 count on no data", function() {
		var logger = intervalLogger.create("test",reportStub);
		clock.tick(1100);
		expect(reportStub.called).to.equal(false);
	});

	it("will log if a key is set", function() {
		var logger = intervalLogger.create("test",reportStub);
		logger.increment("a");
		clock.tick(1100);
		expect(reportStub.callCount).to.equal(1);
		expect(reportStub.withArgs('test',{'a': 1}).callCount).to.equal(1);
	});

	it("increments a 'count' subkey if no key is provided", function() {
		var logger = intervalLogger.create("test", reportStub);
		logger.increment();
		clock.tick(1100);
		expect(reportStub.callCount).to.equal(1);
		expect(reportStub.withArgs('test',{'count': 1}).callCount).to.equal(1);
	});

  it('resets counts after the interval', function() {
		var logger = intervalLogger.create("test",reportStub);
		logger.increment();
		clock.tick(5000);
    expect(reportStub.callCount).to.equal(1);
    expect(logger.subkeys).to.deep.equal({ 'count': NaN });
  });

  it('respects intervalMS parameter', function() {
		var logger = intervalLogger.create("test",reportStub,100);
		logger.increment();
		clock.tick(101);
    expect(reportStub.callCount).to.equal(1);
  });

  it('will report NaN for known subkeys when none have been reported', function() {
		var logger = intervalLogger.create("test",reportStub,100,true);
		logger.increment();
		clock.tick(101);
		expect(reportStub.withArgs('test',{'count': 1}).callCount).to.equal(1);
		clock.tick(101);
		expect(reportStub.withArgs('test',{'count': NaN}).callCount).to.equal(1);
  });
});
