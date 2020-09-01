const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const Timelock = contract.fromArtifact('TimelockControllerMock');
const CallReceiverMock = contract.fromArtifact('CallReceiverMock');
const Implementation2 = contract.fromArtifact('Implementation2');
const MINDELAY = time.duration.days(1);

function genOperation (target, value, data, salt) {
  const id = web3.utils.keccak256(web3.eth.abi.encodeParameters([
    'address',
    'uint256',
    'bytes',
    'bytes32',
  ], [
    target,
    value,
    data,
    salt,
  ]));
  return { id, target, value, data, salt };
}

function genOperationBatch (targets, values, datas, salt) {
  const id = web3.utils.keccak256(web3.eth.abi.encodeParameters([
    'address[]',
    'uint256[]',
    'bytes[]',
    'bytes32',
  ], [
    targets,
    values,
    datas,
    salt,
  ]));
  return { id, targets, values, datas, salt };
}

describe('TimelockController', function () {
  const [ admin, proposer, executer, other ] = accounts;

  beforeEach(async function () {
    // Deploy new timelock
    this.tlctrl = await Timelock.new(MINDELAY, { from: admin });
    // Grand proposer & executer role
    await this.tlctrl.grantRole(await this.tlctrl.PROPOSER_ROLE(), proposer, { from: admin });
    await this.tlctrl.grantRole(await this.tlctrl.EXECUTER_ROLE(), executer, { from: admin });
    // Transfer administration to timelock
    await this.tlctrl.makeLive({ from: admin });
    // Mocks
    this.callreceivermock = await CallReceiverMock.new({ from: admin });
    this.implementation2 = await Implementation2.new({ from: admin });
  });

  it('initial state', async function () {
    expect(await this.tlctrl.viewMinDelay()).to.be.bignumber.equal(MINDELAY);
  });

  describe('methods', function () {
    describe('schedule', function () {
      beforeEach(async function () {
        this.operation = genOperation(
          ZERO_ADDRESS,
          0,
          web3.utils.randomHex(4),
          web3.utils.randomHex(32),
        );
      });

      it('proposer can schedule', async function () {
        const receipt = await this.tlctrl.schedule(this.operation.id, MINDELAY, { from: proposer });
        expectEvent(receipt, 'Scheduled', { id: this.operation.id });
      });

      it('operation is registered', async function () {
        const receipt = await this.tlctrl.schedule(this.operation.id, MINDELAY, { from: proposer });
        expectEvent(receipt, 'Scheduled', { id: this.operation.id });

        const block = await web3.eth.getBlock(receipt.receipt.blockHash);

        expect(await this.tlctrl.viewTimestamp(this.operation.id))
          .to.be.bignumber.equal(web3.utils.toBN(block.timestamp).add(MINDELAY));
      });

      it('prevent overwritting active operation', async function () {
        const receipt = await this.tlctrl.schedule(this.operation.id, MINDELAY, { from: proposer });
        expectEvent(receipt, 'Scheduled', { id: this.operation.id });

        await expectRevert(
          this.tlctrl.schedule(this.operation.id, MINDELAY, { from: proposer }),
          'Timelock: operation already scheduled'
        );
      });

      it('prevent non-proposer from commiting', async function () {
        await expectRevert(
          this.tlctrl.schedule(this.operation.id, MINDELAY, { from: other }),
          'TimelockController: sender requiers permission'
        );
      });
    });

    describe('execute', function () {
      beforeEach(async function () {
        this.operation = genOperation(
          ZERO_ADDRESS,
          0,
          web3.utils.randomHex(4),
          web3.utils.randomHex(32),
        );
      });

      describe('no operation scheduled', function () {
        it('reverts', async function () {
          await expectRevert(
            this.tlctrl.execute(
              this.operation.target,
              this.operation.value,
              this.operation.data,
              this.operation.salt,
              { from: executer }
            ),
            'Timelock: no matching operation'
          );
        });
      });

      describe('with scheduled operation', function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.tlctrl.schedule(this.operation.id, MINDELAY, { from: proposer }));
        });

        describe('to early', function () {
          it('reverts', async function () {
            await expectRevert(
              this.tlctrl.execute(
                this.operation.target,
                this.operation.value,
                this.operation.data,
                this.operation.salt,
                { from: executer }
              ),
              'Timelock: too early to execute'
            );
          });
        });

        describe('almost but not quite', function () {
          beforeEach(async function () {
            const timestamp = await this.tlctrl.viewTimestamp(this.operation.id);
            await time.increaseTo(timestamp - 2); // -1 is to tight, test sometime fails
          });

          it('reverts', async function () {
            await expectRevert(
              this.tlctrl.execute(
                this.operation.target,
                this.operation.value,
                this.operation.data,
                this.operation.salt,
                { from: executer }
              ),
              'Timelock: too early to execute'
            );
          });
        });

        describe('on time', function () {
          beforeEach(async function () {
            const timestamp = await this.tlctrl.viewTimestamp(this.operation.id);
            await time.increaseTo(timestamp);
          });

          it('executer can reveal', async function () {
            const receipt = await this.tlctrl.execute(
              this.operation.target,
              this.operation.value,
              this.operation.data,
              this.operation.salt,
              { from: executer }
            );
            expectEvent(receipt, 'Executed', { id: this.operation.id });
            expectEvent(receipt, 'Call', {
              id: this.operation.id,
              index: web3.utils.toBN(0),
              target: this.operation.target,
              value: web3.utils.toBN(this.operation.value),
              data: this.operation.data,
            });
          });

          it('timestamp is cleared', async function () {
            const receipt = await this.tlctrl.execute(
              this.operation.target,
              this.operation.value,
              this.operation.data,
              this.operation.salt,
              { from: executer }
            );
            expectEvent(receipt, 'Executed', { id: this.operation.id });
            expectEvent(receipt, 'Call', {
              id: this.operation.id,
              index: web3.utils.toBN(0),
              target: this.operation.target,
              value: web3.utils.toBN(this.operation.value),
              data: this.operation.data,
            });

            expect(await this.tlctrl.viewTimestamp(this.operation.id)).to.be.bignumber.equal(web3.utils.toBN(0));
          });

          it('prevent non-executer from revealing', async function () {
            await expectRevert(
              this.tlctrl.execute(
                this.operation.target,
                this.operation.value,
                this.operation.data,
                this.operation.salt,
                { from: other }
              ),
              'TimelockController: sender requiers permission'
            );
          });
        });
      });
    });

    describe('executeBatch', function () {
      beforeEach(async function () {
        this.operation = genOperationBatch(
          Array(8).fill().map(() => ZERO_ADDRESS),
          Array(8).fill().map(() => 0),
          Array(8).fill().map(() => web3.utils.randomHex(4)),
          web3.utils.randomHex(32),
        );
      });

      describe('no scheduled operation', function () {
        it('reverts', async function () {
          await expectRevert(
            this.tlctrl.executeBatch(
              this.operation.targets,
              this.operation.values,
              this.operation.datas,
              this.operation.salt,
              { from: executer }
            ),
            'Timelock: no matching operation'
          );
        });
      });

      describe('with scheduled operation', function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.tlctrl.schedule(this.operation.id, MINDELAY, { from: proposer }));
        });

        describe('to early', function () {
          it('reverts', async function () {
            await expectRevert(
              this.tlctrl.executeBatch(
                this.operation.targets,
                this.operation.values,
                this.operation.datas,
                this.operation.salt,
                { from: executer }
              ),
              'Timelock: too early to execute'
            );
          });
        });

        describe('almost but not quite', function () {
          beforeEach(async function () {
            const timestamp = await this.tlctrl.viewTimestamp(this.operation.id);
            await time.increaseTo(timestamp - 2); // -1 is to tight, test sometime fails
          });

          it('reverts', async function () {
            await expectRevert(
              this.tlctrl.executeBatch(
                this.operation.targets,
                this.operation.values,
                this.operation.datas,
                this.operation.salt,
                { from: executer }
              ),
              'Timelock: too early to execute'
            );
          });
        });

        describe('on time', function () {
          beforeEach(async function () {
            const timestamp = await this.tlctrl.viewTimestamp(this.operation.id);
            await time.increaseTo(timestamp);
          });

          it('executer can reveal', async function () {
            const receipt = await this.tlctrl.executeBatch(
              this.operation.targets,
              this.operation.values,
              this.operation.datas,
              this.operation.salt,
              { from: executer }
            );
            expectEvent(receipt, 'Executed', { id: this.operation.id });
            for (const i in this.operation.targets) {
              expectEvent(receipt, 'Call', {
                id: this.operation.id,
                index: web3.utils.toBN(i),
                target: this.operation.targets[i],
                value: web3.utils.toBN(this.operation.values[i]),
                data: this.operation.datas[i],
              });
            }
          });

          it('timestamp is cleared', async function () {
            const receipt = await this.tlctrl.executeBatch(
              this.operation.targets,
              this.operation.values,
              this.operation.datas,
              this.operation.salt,
              { from: executer }
            );
            expectEvent(receipt, 'Executed', { id: this.operation.id });
            for (const i in this.operation.targets) {
              expectEvent(receipt, 'Call', {
                id: this.operation.id,
                index: web3.utils.toBN(i),
                target: this.operation.targets[i],
                value: web3.utils.toBN(this.operation.values[i]),
                data: this.operation.datas[i],
              });
            }

            expect(await this.tlctrl.viewTimestamp(this.operation.id)).to.be.bignumber.equal(web3.utils.toBN(0));
          });

          it('prevent non-executer from revealing', async function () {
            await expectRevert(
              this.tlctrl.executeBatch(
                this.operation.targets,
                this.operation.values,
                this.operation.datas,
                this.operation.salt,
                { from: other }
              ),
              'TimelockController: sender requiers permission'
            );
          });

          it('length missmatch #1', async function () {
            await expectRevert(
              this.tlctrl.executeBatch(
                [],
                this.operation.values,
                this.operation.datas,
                this.operation.salt,
                { from: executer }
              ),
              'TimelockController: length missmatch'
            );
          });

          it('length missmatch #2', async function () {
            await expectRevert(
              this.tlctrl.executeBatch(
                this.operation.targets,
                [],
                this.operation.datas,
                this.operation.salt,
                { from: executer }
              ),
              'TimelockController: length missmatch'
            );
          });

          it('length missmatch #3', async function () {
            await expectRevert(
              this.tlctrl.executeBatch(
                this.operation.targets,
                this.operation.values,
                [],
                this.operation.salt,
                { from: executer }
              ),
              'TimelockController: length missmatch'
            );
          });
        });
      });

      it('partial execution', async function () {
        const operation = genOperationBatch(
          [
            this.callreceivermock.address,
            this.callreceivermock.address,
            this.callreceivermock.address,
          ],
          [
            0,
            0,
            0,
          ],
          [
            this.callreceivermock.contract.methods.mockFunction().encodeABI(),
            this.callreceivermock.contract.methods.mockFunctionThrows().encodeABI(),
            this.callreceivermock.contract.methods.mockFunction().encodeABI(),
          ],
          web3.utils.randomHex(32),
        );

        await this.tlctrl.schedule(operation.id, MINDELAY, { from: proposer });
        await time.increase(MINDELAY);
        await expectRevert(
          this.tlctrl.executeBatch(
            operation.targets,
            operation.values,
            operation.datas,
            operation.salt,
            { from: executer }
          ),
          'TimelockController: underlying transaction reverted'
        );
      });
    });

    describe('cancel', function () {
      beforeEach(async function () {
        this.operation = genOperation(
          ZERO_ADDRESS,
          0,
          web3.utils.randomHex(4),
          web3.utils.randomHex(32),
        );
        ({ logs: this.logs } = await this.tlctrl.schedule(this.operation.id, MINDELAY, { from: proposer }));
      });

      it('proposer can cancel', async function () {
        const receipt = await this.tlctrl.cancel(this.operation.id, { from: proposer });
        expectEvent(receipt, 'Cancel', { id: this.operation.id });
      });

      it('timestamp is cleared', async function () {
        const receipt = await this.tlctrl.cancel(this.operation.id, { from: proposer });
        expectEvent(receipt, 'Cancel', { id: this.operation.id });

        expect(await this.tlctrl.viewTimestamp(this.operation.id)).to.be.bignumber.equal(web3.utils.toBN(0));
      });

      it('prevent non-proposer from canceling', async function () {
        await expectRevert(
          this.tlctrl.cancel(this.operation.id, { from: other }),
          'TimelockController: sender requiers permission'
        );
      });
    });
  });

  describe('maintenance', function () {
    it('prevent unauthorized maintenance', async function () {
      await expectRevert(
        this.tlctrl.updateDelay(0, { from: other }),
        'TimelockController: sender requiers permission'
      );
    });

    it('timelock scheduled maintenance', async function () {
      const randomBN = web3.utils.randomHex(16);
      const operation = genOperation(
        this.tlctrl.address,
        0,
        this.tlctrl.contract.methods.updateDelay(randomBN).encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(operation.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);
      const receipt = await this.tlctrl.execute(
        operation.target,
        operation.value,
        operation.data,
        operation.salt,
        { from: executer }
      );
      expectEvent(receipt, 'Executed', { id: operation.id });
      expectEvent(receipt, 'Call', { id: operation.id });
      expectEvent(receipt, 'MinDelayChange', { newDuration: web3.utils.toBN(randomBN), oldDuration: MINDELAY });

      expect(await this.tlctrl.viewMinDelay()).to.be.bignumber.equal(web3.utils.toBN(randomBN));
    });
  });

  describe('scenari', function () {
    it('call', async function () {
      const randomBN = web3.utils.randomHex(16);
      const operation = genOperation(
        this.implementation2.address,
        0,
        this.implementation2.contract.methods.setValue(randomBN).encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(operation.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);
      const receipt = await this.tlctrl.execute(
        operation.target,
        operation.value,
        operation.data,
        operation.salt,
        { from: executer }
      );
      expectEvent(receipt, 'Executed', { id: operation.id });
      expectEvent(receipt, 'Call', { id: operation.id });

      expect(await this.implementation2.getValue()).to.be.bignumber.equal(web3.utils.toBN(randomBN));
    });

    it('call reverting', async function () {
      const operation = genOperation(
        this.callreceivermock.address,
        0,
        this.callreceivermock.contract.methods.mockFunctionRevertsNoReason().encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(operation.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);
      await expectRevert(
        this.tlctrl.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.salt,
          { from: executer }
        ),
        'TimelockController: underlying transaction reverted'
      );
    });

    it('call throw', async function () {
      const operation = genOperation(
        this.callreceivermock.address,
        0,
        this.callreceivermock.contract.methods.mockFunctionThrows().encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(operation.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);
      await expectRevert(
        this.tlctrl.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.salt,
          { from: executer }
        ),
        'TimelockController: underlying transaction reverted'
      );
    });

    it('call out of gas', async function () {
      const operation = genOperation(
        this.callreceivermock.address,
        0,
        this.callreceivermock.contract.methods.mockFunctionOutOfGas().encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(operation.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);
      await expectRevert(
        this.tlctrl.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.salt,
          { from: executer }
        ),
        'TimelockController: underlying transaction reverted'
      );
    });

    it('call payable with eth', async function () {
      const operation = genOperation(
        this.callreceivermock.address,
        1,
        this.callreceivermock.contract.methods.mockFunction().encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(operation.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);

      expect(await web3.eth.getBalance(this.tlctrl.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      const receipt = await this.tlctrl.execute(
        operation.target,
        operation.value,
        operation.data,
        operation.salt,
        { from: executer, value: 1 }
      );
      expectEvent(receipt, 'Executed', { id: operation.id });
      expectEvent(receipt, 'Call', { id: operation.id });

      expect(await web3.eth.getBalance(this.tlctrl.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(1));
    });

    it('call nonpayable with eth', async function () {
      const operation = genOperation(
        this.callreceivermock.address,
        1,
        this.callreceivermock.contract.methods.mockFunctionNonPayable().encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(operation.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);

      expect(await web3.eth.getBalance(this.tlctrl.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      await expectRevert(
        this.tlctrl.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.salt,
          { from: executer }
        ),
        'TimelockController: underlying transaction reverted'
      );

      expect(await web3.eth.getBalance(this.tlctrl.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
    });

    it('call reverting with eth', async function () {
      const operation = genOperation(
        this.callreceivermock.address,
        1,
        this.callreceivermock.contract.methods.mockFunctionRevertsNoReason().encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(operation.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);

      expect(await web3.eth.getBalance(this.tlctrl.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      await expectRevert(
        this.tlctrl.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.salt,
          { from: executer }
        ),
        'TimelockController: underlying transaction reverted'
      );

      expect(await web3.eth.getBalance(this.tlctrl.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
    });
  });
});
