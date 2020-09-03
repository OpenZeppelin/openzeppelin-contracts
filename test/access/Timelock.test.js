const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_BYTES32 } = constants;

const { expect } = require('chai');

const Timelock = contract.fromArtifact('TimelockMock');
const MINDELAY = time.duration.days(1);

describe('Timelock', function () {
  const [ admin ] = accounts;

  beforeEach(async function () {
    // Deploy new timelock
    this.timelock = await Timelock.new(MINDELAY, { from: admin });
  });

  describe('delay', function () {
    it('initial state', async function () {
      expect(await this.timelock.viewMinDelay()).to.be.bignumber.equal(MINDELAY);
    });

    it('can change min delay', async function () {
      const newDelay = web3.utils.toBN(web3.utils.randomHex(16));
      const receipt = await this.timelock.updateDelay(newDelay, { from: admin });
      expectEvent(receipt, 'MinDelayChange', { newDuration: newDelay, oldDuration: MINDELAY });
      expect(await this.timelock.viewMinDelay()).to.be.bignumber.equal(newDelay);
    });
  });

  describe('schedule', function () {
    beforeEach(async function () {
      this.id = web3.utils.randomHex(32);
    });

    it('can schedule', async function () {
      await this.timelock.schedule(this.id, MINDELAY, { from: admin });
    });

    it('operation is registered', async function () {
      const receipt = await this.timelock.schedule(this.id, MINDELAY, { from: admin });
      const block = await web3.eth.getBlock(receipt.receipt.blockHash);
      expectEvent(receipt, 'Scheduled', { id: this.id });
      expect(await this.timelock.viewTimestamp(this.id))
        .to.be.bignumber.equal(web3.utils.toBN(block.timestamp).add(MINDELAY));
      expect(await this.timelock.isOperationPending(this.id)).to.be.equal(true);
      expect(await this.timelock.isOperationReady(this.id)).to.be.equal(false);
      expect(await this.timelock.isOperationDone(this.id)).to.be.equal(false);
    });

    it('insufficient delay', async function () {
      await expectRevert(
        this.timelock.schedule(this.id, MINDELAY - 1, { from: admin }),
        'Timelock: insufficient delay'
      );
    });

    it('cannot overwrite', async function () {
      await this.timelock.schedule(this.id, MINDELAY, { from: admin });
      await expectRevert(
        this.timelock.schedule(this.id, MINDELAY, { from: admin }),
        'Timelock: operation already scheduled'
      );
    });

    it('cannot reschedule', async function () {
      await this.timelock.schedule(this.id, MINDELAY, { from: admin });
      await time.increase(MINDELAY);
      await this.timelock.execute(this.id, ZERO_BYTES32, { from: admin });
      await expectRevert(
        this.timelock.schedule(this.id, MINDELAY, { from: admin }),
        'Timelock: operation already scheduled'
      );
    });
  });

  describe('execute', function () {
    beforeEach(async function () {
      this.id = web3.utils.randomHex(32);
      await this.timelock.schedule(this.id, MINDELAY, { from: admin });
    });

    describe('unscheduled', function () {
      it('cannot execute unscheduled', async function () {
        const otherid = web3.utils.randomHex(32);
        await expectRevert(
          this.timelock.execute(otherid, ZERO_BYTES32, { from: admin }),
          'Timelock: operation is not ready'
        );
      });
    });

    describe('too early', function () {
      it('check status', async function () {
        expect(await this.timelock.isOperationPending(this.id)).to.be.equal(true);
        expect(await this.timelock.isOperationReady(this.id)).to.be.equal(false);
        expect(await this.timelock.isOperationDone(this.id)).to.be.equal(false);
      });

      it('cannot execute', async function () {
        await expectRevert(
          this.timelock.execute(this.id, ZERO_BYTES32, { from: admin }),
          'Timelock: operation is not ready'
        );
      });
    });

    describe('on time', function () {
      beforeEach(async function () {
        await time.increaseTo(await this.timelock.viewTimestamp(this.id));
      });

      it('check status', async function () {
        expect(await this.timelock.isOperationPending(this.id)).to.be.equal(true);
        expect(await this.timelock.isOperationReady(this.id)).to.be.equal(true);
        expect(await this.timelock.isOperationDone(this.id)).to.be.equal(false);
      });

      it('can execute', async function () {
        const receipt = await this.timelock.execute(this.id, ZERO_BYTES32, { from: admin });
        expectEvent(receipt, 'Executed', { id: this.id });
      });

      it('operation is registered', async function () {
        const receipt = await this.timelock.execute(this.id, ZERO_BYTES32, { from: admin });
        expectEvent(receipt, 'Executed', { id: this.id });
        expect(await this.timelock.isOperationPending(this.id)).to.be.equal(false);
        expect(await this.timelock.isOperationReady(this.id)).to.be.equal(false);
        expect(await this.timelock.isOperationDone(this.id)).to.be.equal(true);
      });

      it('prevent re-execution', async function () {
        await this.timelock.execute(this.id, ZERO_BYTES32, { from: admin });
        await expectRevert(
          this.timelock.execute(this.id, ZERO_BYTES32, { from: admin }),
          'Timelock: operation is not ready'
        );
      });
    });
  });

  describe('cancel', function () {
    beforeEach(async function () {
      this.id = web3.utils.randomHex(32);
      await this.timelock.schedule(this.id, MINDELAY, { from: admin });
    });

    it('can cancel', async function () {
      const receipt = await this.timelock.cancel(this.id, { from: admin });
      expectEvent(receipt, 'Canceled', { id: this.id });
    });

    it('memory is cleared', async function () {
      const receipt = await this.timelock.cancel(this.id, { from: admin });
      expectEvent(receipt, 'Canceled', { id: this.id });
      expect(await this.timelock.viewTimestamp(this.id)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await this.timelock.isOperationPending(this.id)).to.be.equal(false);
      expect(await this.timelock.isOperationReady(this.id)).to.be.equal(false);
      expect(await this.timelock.isOperationDone(this.id)).to.be.equal(false);
    });

    it('can reschedule', async function () {
      await this.timelock.cancel(this.id, { from: admin });
      const receipt = await this.timelock.schedule(this.id, MINDELAY, { from: admin });
      expectEvent(receipt, 'Scheduled', { id: this.id });
    });

    it('cannot cancel after execution', async function () {
      await time.increaseTo(await this.timelock.viewTimestamp(this.id));
      await this.timelock.execute(this.id, ZERO_BYTES32, { from: admin });
      await expectRevert(
        this.timelock.cancel(this.id, { from: admin }),
        'Timelock: operation is already executed'
      );
    });
  });

  describe('dependency support', function () {
    beforeEach(async function () {
      this.id1 = web3.utils.randomHex(32);
      this.id2 = web3.utils.randomHex(32);
      await this.timelock.schedule(this.id1, MINDELAY, { from: admin });
      await this.timelock.schedule(this.id2, MINDELAY, { from: admin });
      await time.increase(MINDELAY);
    });

    it('cannot execute before dependency', async function () {
      await expectRevert(
        this.timelock.execute(this.id2, this.id1, { from: admin }),
        'Timelock: missing dependency'
      );
    });

    it('can execute after dependency', async function () {
      await this.timelock.execute(this.id1, ZERO_BYTES32, { from: admin });
      await this.timelock.execute(this.id2, this.id1, { from: admin });
    });
  });
});
