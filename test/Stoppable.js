contract('Stoppable', function(accounts) {

  it("can perform normal process in non-emergency", async function() {
    let stoppable = await StoppableMock.new();
    let count0 = await stoppable.count();
    assert.equal(count0, 0);

    let normalProcess = await stoppable.normalProcess();
    let count1 = await stoppable.count();
    assert.equal(count1, 1);
  });

  it("can not perform normal process in emergency", async function() {
    let stoppable = await StoppableMock.new();
    let emergencyStop = await stoppable.emergencyStop();
    let count0 = await stoppable.count();
    assert.equal(count0, 0);

    let normalProcess = await stoppable.normalProcess();
    let count1 = await stoppable.count();
    assert.equal(count1, 0);
  });


  it("can not take drastic measure in non-emergency", async function() {
    let stoppable = await StoppableMock.new();
    let drasticMeasure = await stoppable.drasticMeasure();
    let drasticMeasureTaken = await stoppable.drasticMeasureTaken();

    assert.isFalse(drasticMeasureTaken);
  });

  it("can take a drastic measure in an emergency", async function() {
    let stoppable = await StoppableMock.new();
    let emergencyStop = await stoppable.emergencyStop();
    let drasticMeasure = await stoppable.drasticMeasure();
    let drasticMeasureTaken = await stoppable.drasticMeasureTaken();

    assert.isTrue(drasticMeasureTaken);
  });

  it("should resume allowing normal process after emergency is over", async function() {
    let stoppable = await StoppableMock.new();
    let emergencyStop = await stoppable.emergencyStop();
    let release = await stoppable.release();
    let normalProcess = await stoppable.normalProcess();
    let count0 = await stoppable.count();

    assert.equal(count0, 1);
  });

});
