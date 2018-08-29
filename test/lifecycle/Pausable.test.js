const { assertRevert } = require('../helpers/assertRevert');
const expectEvent = require('../helpers/expectEvent');
const PausableMock = artifacts.require('PausableMock');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Pausable', function () {
  beforeEach(async function () {
    this.Pausable = await PausableMock.new();
  });

  it('can perform normal process in non-pause', async function () {
    (await this.Pausable.count()).should.be.bignumber.equal(0);

    await this.Pausable.normalProcess();
    (await this.Pausable.count()).should.be.bignumber.equal(1);
  });

  it('can not perform normal process in pause', async function () {
    await this.Pausable.pause();
    (await this.Pausable.count()).should.be.bignumber.equal(0);

    await assertRevert(this.Pausable.normalProcess());
    (await this.Pausable.count()).should.be.bignumber.equal(0);
  });

  it('can not take drastic measure in non-pause', async function () {
    await assertRevert(this.Pausable.drasticMeasure());
    (await this.Pausable.drasticMeasureTaken()).should.equal(false);
  });

  it('can take a drastic measure in a pause', async function () {
    await this.Pausable.pause();
    await this.Pausable.drasticMeasure();
    (await this.Pausable.drasticMeasureTaken()).should.equal(true);
  });

  it('should resume allowing normal process after pause is over', async function () {
    await this.Pausable.pause();
    await this.Pausable.unpause();
    await this.Pausable.normalProcess();
    (await this.Pausable.count()).should.be.bignumber.equal(1);
  });

  it('should prevent drastic measure after pause is over', async function () {
    await this.Pausable.pause();
    await this.Pausable.unpause();

    await assertRevert(this.Pausable.drasticMeasure());

    (await this.Pausable.drasticMeasureTaken()).should.equal(false);
  });

  it('should log Pause and Unpause events appropriately', async function () {
    const setPauseLogs = (await this.Pausable.pause()).logs;
    expectEvent.inLogs(setPauseLogs, 'Paused');

    const setUnPauseLogs = (await this.Pausable.unpause()).logs;
    expectEvent.inLogs(setUnPauseLogs, 'Unpaused');
  });
});
