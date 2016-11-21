contract('Stoppable', function(accounts) {

  it("can perform normal process in non-emergency", function(done) {
    var stoppable;
    return StoppableMock.new()
      .then(function(_stoppable) {
        stoppable = _stoppable;
        return stoppable.count();
      })
      .then(function(count) {
        assert.equal(count, 0);
      })
      .then(function () {
        return stoppable.normalProcess();
      })
      .then(function() {
        return stoppable.count();
      })
      .then(function(count) {
        assert.equal(count, 1);
      })
      .then(done);
  });

  it("can not perform normal process in emergency", function(done) {
    var stoppable;
    return StoppableMock.new()
      .then(function(_stoppable) {
        stoppable = _stoppable;
        return stoppable.emergencyStop();
      })
      .then(function () {
        return stoppable.count();
      })
      .then(function(count) {
        assert.equal(count, 0);
      })
      .then(function () {
        return stoppable.normalProcess();
      })
      .then(function() {
        return stoppable.count();
      })
      .then(function(count) {
        assert.equal(count, 0);
      })
      .then(done);
  });


  it("can not take drastic measure in non-emergency", function(done) {
    var stoppable;
    return StoppableMock.new()
      .then(function(_stoppable) {
        stoppable = _stoppable;
        return stoppable.drasticMeasure();
      })
      .then(function() {
        return stoppable.drasticMeasureTaken();
      })
      .then(function(taken) {
        assert.isFalse(taken);
      })
      .then(done);
  });

  it("can take a drastic measure in an emergency", function(done) {
    var stoppable;
    return StoppableMock.new()
      .then(function(_stoppable) {
        stoppable = _stoppable;
        return stoppable.emergencyStop();
      })
      .then(function() {
        return stoppable.drasticMeasure();
      })
      .then(function() {
        return stoppable.drasticMeasureTaken();
      })
      .then(function(taken) {
        assert.isTrue(taken);
      })
      .then(done);
  });

  it("should resume allowing normal process after emergency is over", function(done) {
    var stoppable;
    return StoppableMock.new()
      .then(function(_stoppable) {
        stoppable = _stoppable;
        return stoppable.emergencyStop();
      })
      .then(function () {
        return stoppable.release();
      })
      .then(function() {
        return stoppable.normalProcess();
      })
      .then(function() {
        return stoppable.count();
      })
      .then(function(count) {
        assert.equal(count, 1);
      })
      .then(done);
  });

});
