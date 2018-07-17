
import assertRevert from '../helpers/assertRevert';
const DecentralizedPausableMock = artifacts.require('DecentralizedPausableMock');

contract('DecentralizedPausable', function (accounts) {
  it('can perform normal process in non-pause', async function () {
    let DecentralizedPausable = await DecentralizedPausableMock.new();
    let count0 = await DecentralizedPausable.count();
    assert.equal(count0, 0);

    await DecentralizedPausable.normalProcess();
    let count1 = await DecentralizedPausable.count();
    assert.equal(count1, 1);
  });

  it('can not perform normal process in pause', async function () {
    let DecentralizedPausable = await DecentralizedPausableMock.new();
    await DecentralizedPausable.pause();
    let count0 = await DecentralizedPausable.count();
    assert.equal(count0, 0);

    await assertRevert(DecentralizedPausable.normalProcess());
    let count1 = await DecentralizedPausable.count();
    assert.equal(count1, 0);
  });

  it('can not take drastic measure in non-pause', async function () {
    let DecentralizedPausable = await DecentralizedPausableMock.new();
    await assertRevert(DecentralizedPausable.drasticMeasure());
    const drasticMeasureTaken = await DecentralizedPausable.drasticMeasureTaken();
    assert.isFalse(drasticMeasureTaken);
  });

  it('can take a drastic measure in a pause', async function () {
    let DecentralizedPausable = await DecentralizedPausableMock.new();
    await DecentralizedPausable.pause();
    await DecentralizedPausable.drasticMeasure();
    let drasticMeasureTaken = await DecentralizedPausable.drasticMeasureTaken();

    assert.isTrue(drasticMeasureTaken);
  });

  it('should resume allowing normal process after pause is over', async function () {
    let DecentralizedPausable = await DecentralizedPausableMock.new();
    await DecentralizedPausable.pause();
    await DecentralizedPausable.unpause();
    await DecentralizedPausable.normalProcess();
    let count0 = await DecentralizedPausable.count();

    assert.equal(count0, 1);
  });

  it('should resume allowing normal process specify unpaused user.', async function () {
    let DecentralizedPausable = await DecentralizedPausableMock.new();
    await DecentralizedPausable.pause();
    await DecentralizedPausable.unpauseOnlySelf({from: accounts[1]});
    await DecentralizedPausable.normalProcess({from: accounts[1]});
    let count0 = await DecentralizedPausable.count();

    assert.equal(count0, 1);
  });

  it('the owner can not call unpauseOnlySelf.', async function () {
    let DecentralizedPausable = await DecentralizedPausableMock.new();
    await DecentralizedPausable.pause();
    await assertRevert(DecentralizedPausable.unpauseOnlySelf());

  });

  it('can not perform normal process to not specify unpaused user.', async function () {
    let DecentralizedPausable = await DecentralizedPausableMock.new();
    await DecentralizedPausable.pause();
    await DecentralizedPausable.unpauseOnlySelf({from: accounts[1]});
    await assertRevert(DecentralizedPausable.normalProcess());

    await DecentralizedPausable.drasticMeasure();
    let drasticMeasureTaken = await DecentralizedPausable.drasticMeasureTaken();

    assert.isTrue(drasticMeasureTaken);
  });

  it('can not perform normal process when second pause.', async function () {
    let DecentralizedPausable = await DecentralizedPausableMock.new();
    await DecentralizedPausable.pause();
    await DecentralizedPausable.unpauseOnlySelf({from: accounts[1]});
    await DecentralizedPausable.normalProcess({from: accounts[1]});
    let count0 = await DecentralizedPausable.count();

    assert.equal(count0, 1);

    await DecentralizedPausable.unpause();
    await DecentralizedPausable.pause();
    await assertRevert(DecentralizedPausable.normalProcess({from: accounts[1]}));
  });

  it('should prevent drastic measure after pause is over', async function () {
    let DecentralizedPausable = await DecentralizedPausableMock.new();
    await DecentralizedPausable.pause();
    await DecentralizedPausable.unpause();

    await assertRevert(DecentralizedPausable.drasticMeasure());

    const drasticMeasureTaken = await DecentralizedPausable.drasticMeasureTaken();
    assert.isFalse(drasticMeasureTaken);
  });
});
