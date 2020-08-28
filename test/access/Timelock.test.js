const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const Timelock = contract.fromArtifact('TimelockMock');
const CallReceiverMock = contract.fromArtifact('CallReceiverMock');
const Implementation2  = contract.fromArtifact('Implementation2');
const LOCKDURATION = time.duration.days(1);

describe('Timelock', function () {
  const [ owner, other ] = accounts;

  beforeEach(async function () {
    this.timelock = await Timelock.new(LOCKDURATION, { from: owner });
  });

  it('initial state', async function () {
    expect(await this.timelock.lockDuration()).to.be.bignumber.equal(LOCKDURATION);
    expect(await this.timelock.nextTX()).to.be.bignumber.equal(web3.utils.toBN(0));
    expect(await this.timelock.totalTX()).to.be.bignumber.equal(web3.utils.toBN(0));
  });

  describe('methods', function () {
    describe('scheduleTX', function () {
      it('prevents non-owners from scheduling', async function () {
        const target = web3.utils.toChecksumAddress(web3.utils.randomHex(20));
        const value  = web3.utils.randomHex(16);
        const data   = web3.utils.randomHex(64);

        await expectRevert(
          this.timelock.scheduleTX(target, value, data, { from: other }),
          'Ownable: caller is not the owner'
        );
      });

      it('scheduled operation is registered', async function () {
        for (let i = 0; i<8; ++i)
        {
          const target = web3.utils.toChecksumAddress(web3.utils.randomHex(20));
          const value  = web3.utils.randomHex(16);
          const data   = web3.utils.randomHex(64);

          const receipt = await this.timelock.scheduleTX(target, value, data, { from: owner });
          const block = await web3.eth.getBlock(receipt.receipt.blockHash);

          expectEvent(receipt, 'TXScheduled', { index: web3.utils.toBN(i) });

          expect(await this.timelock.nextTX()).to.be.bignumber.equal(web3.utils.toBN(0))
          expect(await this.timelock.totalTX()).to.be.bignumber.equal(web3.utils.toBN(i+1))

          const operation = await this.timelock.viewTX(i)
          expect(operation.target).to.be.equal(target);
          expect(operation.value).to.be.bignumber.equal(web3.utils.toBN(value));
          expect(operation.data).to.be.equal(data);
          expect(operation.timestamp).to.be.bignumber.equal(web3.utils.toBN(block.timestamp).add(LOCKDURATION));
        }
      });
    });

    describe('executeTX', function () {
      describe('empty queue', function () {
        it('reverts', async function () {
          await expectRevert(
            this.timelock.executeTX({ from: owner }),
            'empty-queue'
          );
        });
      });

      describe('non-empty queue', function () {
        beforeEach(async function () {
          const target = web3.utils.toChecksumAddress(web3.utils.randomHex(20));
          const value  = web3.utils.randomHex(16);
          const data   = web3.utils.randomHex(64);
          ({ logs: this.logs } = await this.timelock.scheduleTX(target, value, data, { from: owner }));
        });

        describe('early execution', function () {
          Array(8).fill().forEach((_, i) => {
            it(`reverts #${i}`, async function () {
              await expectRevert(
                this.timelock.executeTX({ from: owner }),
                'too-early-to-execute'
              );
            });
          });
        });

        describe('almost but not quite', function () {
          beforeEach(async function () {
            const { timestamp } = await this.timelock.viewTX(0);
            await time.increaseTo(timestamp - 2) // -1 is to tight, test sometime fails
          });


          Array(8).fill().forEach((_, i) => {
            it(`reverts #${i}`, async function () {
              await expectRevert(
                this.timelock.executeTX({ from: owner }),
                'too-early-to-execute'
              );
            });
          });
        });

        describe('on time', function () {
          beforeEach(async function () {
            const { timestamp } = await this.timelock.viewTX(0);
            await time.increaseTo(timestamp)
          });

          Array(8).fill().forEach((_, i) => {
            it(`owner can execute #${i}`, async function () {
              const receipt = await this.timelock.executeTX({ from: owner });
              expectEvent(receipt, 'TXExecuted', { index: web3.utils.toBN(0), success: false }); // random call at random address fails

              expect(await this.timelock.nextTX()).to.be.bignumber.equal(web3.utils.toBN(1))
              expect(await this.timelock.totalTX()).to.be.bignumber.equal(web3.utils.toBN(1))

              const operation = await this.timelock.viewTX(0)
              expect(operation.target).to.be.equal(ZERO_ADDRESS);
              expect(operation.value).to.be.bignumber.equal(web3.utils.toBN(0));
              expect(operation.data).to.be.equal(null);
              expect(operation.timestamp).to.be.bignumber.equal(web3.utils.toBN(0));
            });
          });

          it('prevents non-owners from executing', async function () {
            await expectRevert(
              this.timelock.executeTX({ from: other }),
              'Ownable: caller is not the owner.'
            );
          });
        });
      });
    });

    describe('cancelTX', function () {
      describe('empty queue', function () {
        it('reverts', async function () {
          await expectRevert(
            this.timelock.cancelTX({ from: owner }),
            'empty-queue'
          );
        });
      });

      describe('non-empty queue', function () {
        beforeEach(async function () {
          const target = web3.utils.toChecksumAddress(web3.utils.randomHex(20));
          const value  = web3.utils.randomHex(16);
          const data   = web3.utils.randomHex(64);
          ({ logs: this.logs } = await this.timelock.scheduleTX(target, value, data, { from: owner }));
        });

        it('owner can cancel', async function () {
          const receipt = await this.timelock.cancelTX({ from: owner });
          expectEvent(receipt, 'TXCanceled', { index: web3.utils.toBN(0) });

          expect(await this.timelock.nextTX()).to.be.bignumber.equal(web3.utils.toBN(1))
          expect(await this.timelock.totalTX()).to.be.bignumber.equal(web3.utils.toBN(1))

          const operation = await this.timelock.viewTX(0)
          expect(operation.target).to.be.equal(ZERO_ADDRESS);
          expect(operation.value).to.be.bignumber.equal(web3.utils.toBN(0));
          expect(operation.data).to.be.equal(null);
          expect(operation.timestamp).to.be.bignumber.equal(web3.utils.toBN(0));
        });

        it('prevents non-owners from executing', async function () {
          await expectRevert(
            this.timelock.executeTX({ from: other }),
            'Ownable: caller is not the owner.'
          );
        });
      });
    });
  });

  describe('scenari', function () {
    beforeEach(async function () {
      this.callreceivermock = await CallReceiverMock.new({ from: owner });
      this.implementation2 = await Implementation2.new({ from: owner });
    });

    it('call', async function () {
      const randomBN = web3.utils.randomHex(16);
      await this.timelock.scheduleTX(
        this.implementation2.address,
        0,
        this.implementation2.contract.methods.setValue(randomBN).encodeABI(),
        { from: owner }
      );

      await time.increase(LOCKDURATION);

      const receipt = await this.timelock.executeTX({ from: owner });
      expectEvent(receipt, 'TXExecuted', { index: web3.utils.toBN(0), success: true });

      expect(await this.implementation2.getValue()).to.be.bignumber.equal(web3.utils.toBN(randomBN));
    });

    it('call reverting', async function () {
      await this.timelock.scheduleTX(
        this.callreceivermock.address,
        0,
        this.callreceivermock.contract.methods.mockFunctionRevertsNoReason().encodeABI(),
        { from: owner }
      );

      await time.increase(LOCKDURATION);

      const receipt = await this.timelock.executeTX({ from: owner });
      expectEvent(receipt, 'TXExecuted', { index: web3.utils.toBN(0), success: false });
    });

    it('call throw', async function () {
      await this.timelock.scheduleTX(
        this.callreceivermock.address,
        0,
        this.callreceivermock.contract.methods.mockFunctionThrows().encodeABI(),
        { from: owner }
      );

      await time.increase(LOCKDURATION);

      const receipt = await this.timelock.executeTX({ from: owner });
      expectEvent(receipt, 'TXExecuted', { index: web3.utils.toBN(0), success: false });
    });

    it('call out of gas', async function () {
      await this.timelock.scheduleTX(
        this.callreceivermock.address,
        0,
        this.callreceivermock.contract.methods.mockFunctionOutOfGas().encodeABI(),
        { from: owner }
      );

      await time.increase(LOCKDURATION);

      const receipt = await this.timelock.executeTX({ from: owner });
      expectEvent(receipt, 'TXExecuted', { index: web3.utils.toBN(0), success: false });
    });

    it('call payable with eth', async function () {
      await this.timelock.scheduleTX(
        this.callreceivermock.address,
        1,
        this.callreceivermock.contract.methods.mockFunction().encodeABI(),
        { from: owner }
      );

      await time.increase(LOCKDURATION);

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      const receipt = await this.timelock.executeTX({ from: owner, value: 1 });
      expectEvent(receipt, 'TXExecuted', { index: web3.utils.toBN(0), success: true });

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(1));
    });

    it('call nonpayable with eth', async function () {
      await this.timelock.scheduleTX(
        this.callreceivermock.address,
        1,
        this.callreceivermock.contract.methods.mockFunctionNonPayable().encodeABI(),
        { from: owner }
      );

      await time.increase(LOCKDURATION);

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      const receipt = await this.timelock.executeTX({ from: owner, value: 1 });
      expectEvent(receipt, 'TXExecuted', { index: web3.utils.toBN(0), success: false });

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(1));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
    });

    it('call reverting with eth', async function () {
      await this.timelock.scheduleTX(
        this.callreceivermock.address,
        1,
        this.callreceivermock.contract.methods.mockFunctionRevertsNoReason().encodeABI(),
        { from: owner }
      );

      await time.increase(LOCKDURATION);

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      const receipt = await this.timelock.executeTX({ from: owner, value: 1 });
      expectEvent(receipt, 'TXExecuted', { index: web3.utils.toBN(0), success: false });

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(1));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
    });
  });
});
