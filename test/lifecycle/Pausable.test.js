const { assertRevert } = require('../helpers/assertRevert');
const PausableMock = artifacts.require('PausableMock');

contract('Pausable', function (accounts) {
  beforeEach(async function () {
    this.Pausable = await PausableMock.new();
  });

  it('can perform normal process in non-pause', async function () {
    const count0 = await this.Pausable.count();
    assert.equal(count0, 0);

    await this.Pausable.normalProcess();
    const count1 = await this.Pausable.count();
    assert.equal(count1, 1);
  });

  it('can not perform normal process in pause', async function () {
    await this.Pausable.pause();
    const count0 = await this.Pausable.count();
    assert.equal(count0, 0);

    await assertRevert(this.Pausable.normalProcess());
    const count1 = await this.Pausable.count();
    assert.equal(count1, 0);
  });

  it('can not take drastic measure in non-pause', async function () {
    await assertRevert(this.Pausable.drasticMeasure());
    const drasticMeasureTaken = await this.Pausable.drasticMeasureTaken();
    assert.isFalse(drasticMeasureTaken);
  });

  it('can take a drastic measure in a pause', async function () {
    await this.Pausable.pause();
    await this.Pausable.drasticMeasure();
    const drasticMeasureTaken = await this.Pausable.drasticMeasureTaken();

    assert.isTrue(drasticMeasureTaken);
  });

  it('should resume allowing normal process after pause is over', async function () {
    await this.Pausable.pause();
    await this.Pausable.unpause();
    await this.Pausable.normalProcess();
    const count0 = await this.Pausable.count();

    assert.equal(count0, 1);
  });

  it('should prevent drastic measure after pause is over', async function () {
    await this.Pausable.pause();
    await this.Pausable.unpause();

    await assertRevert(this.Pausable.drasticMeasure());

    const drasticMeasureTaken = await this.Pausable.drasticMeasureTaken();
    assert.isFalse(drasticMeasureTaken);
  });
});
