const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS, ZERO_BYTES32 } = constants;

const { expect } = require('chai');

const TimelockController = contract.fromArtifact('TimelockController');
const CallReceiverMock = contract.fromArtifact('CallReceiverMock');
const Implementation2 = contract.fromArtifact('Implementation2');
const MINDELAY = web3.utils.toBN(web3.utils.randomHex(4));

function genOperation (target, value, data, predecessor, salt) {
  const id = web3.utils.keccak256(web3.eth.abi.encodeParameters([
    'address',
    'uint256',
    'bytes',
    'uint256',
    'bytes32',
  ], [
    target,
    value,
    data,
    predecessor,
    salt,
  ]));
  return { id, target, value, data, predecessor, salt };
}

function genOperationBatch (targets, values, datas, predecessor, salt) {
  const id = web3.utils.keccak256(web3.eth.abi.encodeParameters([
    'address[]',
    'uint256[]',
    'bytes[]',
    'uint256',
    'bytes32',
  ], [
    targets,
    values,
    datas,
    predecessor,
    salt,
  ]));
  return { id, targets, values, datas, predecessor, salt };
}

describe('TimelockController', function () {
  const [ admin, proposer, executer, other ] = accounts;

  beforeEach(async function () {
    // Deploy new timelock
    this.tlctrl = await TimelockController.new(MINDELAY, { from: admin });
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
    describe('simple', function () {
      describe('schedule', function () {
        beforeEach(async function () {
          this.operation = genOperation(
            ZERO_ADDRESS,
            0,
            web3.utils.randomHex(4),
            ZERO_BYTES32,
            web3.utils.randomHex(32),
          );
        });

        it('proposer can schedule', async function () {
          const receipt = await this.tlctrl.schedule(
            this.operation.target,
            this.operation.value,
            this.operation.data,
            this.operation.predecessor,
            this.operation.salt,
            MINDELAY,
            { from: proposer }
          );
          expectEvent(receipt, 'CallScheduled', {
            id: this.operation.id,
            index: web3.utils.toBN(0),
            target: this.operation.target,
            value: web3.utils.toBN(this.operation.value),
            data: this.operation.data,
            predecessor: this.operation.predecessor,
          });
        });

        it('operation is registered', async function () {
          const receipt = await this.tlctrl.schedule(
            this.operation.target,
            this.operation.value,
            this.operation.data,
            this.operation.predecessor,
            this.operation.salt,
            MINDELAY,
            { from: proposer }
          );
          expectEvent(receipt, 'CallScheduled', {
            id: this.operation.id,
            index: web3.utils.toBN(0),
            target: this.operation.target,
            value: web3.utils.toBN(this.operation.value),
            data: this.operation.data,
            predecessor: this.operation.predecessor,
          });

          const block = await web3.eth.getBlock(receipt.receipt.blockHash);

          expect(await this.tlctrl.viewTimestamp(this.operation.id))
            .to.be.bignumber.equal(web3.utils.toBN(block.timestamp).add(MINDELAY));
        });

        it('prevent overwritting active operation', async function () {
          const receipt = await this.tlctrl.schedule(
            this.operation.target,
            this.operation.value,
            this.operation.data,
            this.operation.predecessor,
            this.operation.salt,
            MINDELAY,
            { from: proposer }
          );
          expectEvent(receipt, 'CallScheduled', {
            id: this.operation.id,
            index: web3.utils.toBN(0),
            target: this.operation.target,
            value: web3.utils.toBN(this.operation.value),
            data: this.operation.data,
            predecessor: this.operation.predecessor,
          });

          await expectRevert(
            this.tlctrl.schedule(
              this.operation.target,
              this.operation.value,
              this.operation.data,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
              { from: proposer }
            ),
            'TimelockController: operation already scheduled'
          );
        });

        it('prevent non-proposer from commiting', async function () {
          await expectRevert(
            this.tlctrl.schedule(
              this.operation.target,
              this.operation.value,
              this.operation.data,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
              { from: other }
            ),
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
            ZERO_BYTES32,
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
                this.operation.predecessor,
                this.operation.salt,
                { from: executer }
              ),
              'TimelockController: operation is not ready'
            );
          });
        });

        describe('with scheduled operation', function () {
          beforeEach(async function () {
            ({ receipt: this.receipt, logs: this.logs } = await this.tlctrl.schedule(
              this.operation.target,
              this.operation.value,
              this.operation.data,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
              { from: proposer }
            ));
          });

          describe('to early', function () {
            it('reverts', async function () {
              await expectRevert(
                this.tlctrl.execute(
                  this.operation.target,
                  this.operation.value,
                  this.operation.data,
                  this.operation.predecessor,
                  this.operation.salt,
                  { from: executer }
                ),
                'TimelockController: operation is not ready'
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
                  this.operation.predecessor,
                  this.operation.salt,
                  { from: executer }
                ),
                'TimelockController: operation is not ready'
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
                this.operation.predecessor,
                this.operation.salt,
                { from: executer }
              );
              expectEvent(receipt, 'CallExecuted', {
                id: this.operation.id,
                index: web3.utils.toBN(0),
                target: this.operation.target,
                value: web3.utils.toBN(this.operation.value),
                data: this.operation.data,
              });
            });

            it('prevent non-executer from revealing', async function () {
              await expectRevert(
                this.tlctrl.execute(
                  this.operation.target,
                  this.operation.value,
                  this.operation.data,
                  this.operation.predecessor,
                  this.operation.salt,
                  { from: other }
                ),
                'TimelockController: sender requiers permission'
              );
            });
          });
        });
      });
    });

    describe('batch', function () {
      describe('schedule', function () {
        beforeEach(async function () {
          this.operation = genOperationBatch(
            Array(8).fill().map(() => ZERO_ADDRESS),
            Array(8).fill().map(() => 0),
            Array(8).fill().map(() => web3.utils.randomHex(4)),
            ZERO_BYTES32,
            web3.utils.randomHex(32),
          );
        });

        it('proposer can schedule', async function () {
          const receipt = await this.tlctrl.scheduleBatch(
            this.operation.targets,
            this.operation.values,
            this.operation.datas,
            this.operation.predecessor,
            this.operation.salt,
            MINDELAY,
            { from: proposer }
          );
          for (const i in this.operation.targets) {
            expectEvent(receipt, 'CallScheduled', {
              id: this.operation.id,
              index: web3.utils.toBN(i),
              target: this.operation.targets[i],
              value: web3.utils.toBN(this.operation.values[i]),
              data: this.operation.datas[i],
              predecessor: this.operation.predecessor,
            });
          }
        });

        it('operation is registered', async function () {
          const receipt = await this.tlctrl.scheduleBatch(
            this.operation.targets,
            this.operation.values,
            this.operation.datas,
            this.operation.predecessor,
            this.operation.salt,
            MINDELAY,
            { from: proposer }
          );
          for (const i in this.operation.targets) {
            expectEvent(receipt, 'CallScheduled', {
              id: this.operation.id,
              index: web3.utils.toBN(i),
              target: this.operation.targets[i],
              value: web3.utils.toBN(this.operation.values[i]),
              data: this.operation.datas[i],
              predecessor: this.operation.predecessor,
            });
          }

          const block = await web3.eth.getBlock(receipt.receipt.blockHash);

          expect(await this.tlctrl.viewTimestamp(this.operation.id))
            .to.be.bignumber.equal(web3.utils.toBN(block.timestamp).add(MINDELAY));
        });

        it('prevent overwritting active operation', async function () {
          const receipt = await this.tlctrl.scheduleBatch(
            this.operation.targets,
            this.operation.values,
            this.operation.datas,
            this.operation.predecessor,
            this.operation.salt,
            MINDELAY,
            { from: proposer }
          );
          for (const i in this.operation.targets) {
            expectEvent(receipt, 'CallScheduled', {
              id: this.operation.id,
              index: web3.utils.toBN(i),
              target: this.operation.targets[i],
              value: web3.utils.toBN(this.operation.values[i]),
              data: this.operation.datas[i],
              predecessor: this.operation.predecessor,
            });
          }

          await expectRevert(
            this.tlctrl.scheduleBatch(
              this.operation.targets,
              this.operation.values,
              this.operation.datas,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
              { from: proposer }
            ),
            'TimelockController: operation already scheduled'
          );
        });

        it('prevent non-proposer from commiting', async function () {
          await expectRevert(
            this.tlctrl.scheduleBatch(
              this.operation.targets,
              this.operation.values,
              this.operation.datas,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
              { from: other }
            ),
            'TimelockController: sender requiers permission'
          );
        });
      });

      describe('execute', function () {
        beforeEach(async function () {
          this.operation = genOperationBatch(
            Array(8).fill().map(() => ZERO_ADDRESS),
            Array(8).fill().map(() => 0),
            Array(8).fill().map(() => web3.utils.randomHex(4)),
            ZERO_BYTES32,
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
                this.operation.predecessor,
                this.operation.salt,
                { from: executer }
              ),
              'TimelockController: operation is not ready'
            );
          });
        });

        describe('with scheduled operation', function () {
          beforeEach(async function () {
            ({ receipt: this.receipt, logs: this.logs } = await this.tlctrl.scheduleBatch(
              this.operation.targets,
              this.operation.values,
              this.operation.datas,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
              { from: proposer }
            ));
          });

          describe('to early', function () {
            it('reverts', async function () {
              await expectRevert(
                this.tlctrl.executeBatch(
                  this.operation.targets,
                  this.operation.values,
                  this.operation.datas,
                  this.operation.predecessor,
                  this.operation.salt,
                  { from: executer }
                ),
                'TimelockController: operation is not ready'
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
                  this.operation.predecessor,
                  this.operation.salt,
                  { from: executer }
                ),
                'TimelockController: operation is not ready'
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
                this.operation.predecessor,
                this.operation.salt,
                { from: executer }
              );
              for (const i in this.operation.targets) {
                expectEvent(receipt, 'CallExecuted', {
                  id: this.operation.id,
                  index: web3.utils.toBN(i),
                  target: this.operation.targets[i],
                  value: web3.utils.toBN(this.operation.values[i]),
                  data: this.operation.datas[i],
                });
              }
            });

            it('prevent non-executer from revealing', async function () {
              await expectRevert(
                this.tlctrl.executeBatch(
                  this.operation.targets,
                  this.operation.values,
                  this.operation.datas,
                  this.operation.predecessor,
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
                  this.operation.predecessor,
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
                  this.operation.predecessor,
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
                  this.operation.predecessor,
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
            ZERO_BYTES32,
            web3.utils.randomHex(32),
          );

          await this.tlctrl.scheduleBatch(
            operation.targets,
            operation.values,
            operation.datas,
            operation.predecessor,
            operation.salt,
            MINDELAY,
            { from: proposer }
          );
          await time.increase(MINDELAY);
          await expectRevert(
            this.tlctrl.executeBatch(
              operation.targets,
              operation.values,
              operation.datas,
              operation.predecessor,
              operation.salt,
              { from: executer }
            ),
            'TimelockController: underlying transaction reverted'
          );
        });
      });
    });

    describe('cancel', function () {
      beforeEach(async function () {
        this.operation = genOperation(
          ZERO_ADDRESS,
          0,
          web3.utils.randomHex(4),
          ZERO_BYTES32,
          web3.utils.randomHex(32),
        );
        ({ receipt: this.receipt, logs: this.logs } = await this.tlctrl.schedule(
          this.operation.target,
          this.operation.value,
          this.operation.data,
          this.operation.predecessor,
          this.operation.salt,
          MINDELAY,
          { from: proposer }
        ));
      });

      it('proposer can cancel', async function () {
        const receipt = await this.tlctrl.cancel(this.operation.id, { from: proposer });
        expectEvent(receipt, 'Canceled', { id: this.operation.id });
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
        'TimelockController: restricted maintenance access'
      );
    });

    it('timelock scheduled maintenance', async function () {
      const randomBN = web3.utils.toBN(web3.utils.randomHex(8)).toString();
      const operation = genOperation(
        this.tlctrl.address,
        0,
        this.tlctrl.contract.methods.updateDelay(randomBN.toString()).encodeABI(),
        ZERO_BYTES32,
        web3.utils.randomHex(32),
      );

      const receipt1 = await this.tlctrl.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer }
      );
      expectEvent(receipt1, 'CallScheduled', {
        id: operation.id,
        index: web3.utils.toBN(0),
        target: operation.target,
        value: web3.utils.toBN(operation.value),
        data: operation.data,
        predecessor: operation.predecessor,
      });
      await time.increase(MINDELAY);
      const receipt2 = await this.tlctrl.execute(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        { from: executer }
      );
      expectEvent(receipt2, 'CallExecuted', {
        id: operation.id,
        index: web3.utils.toBN(0),
        target: operation.target,
        value: web3.utils.toBN(operation.value),
        data: operation.data,
      });
      expectEvent(receipt2, 'MinDelayChange', { newDuration: randomBN, oldDuration: MINDELAY });

      expect(await this.tlctrl.viewMinDelay()).to.be.bignumber.equal(randomBN);

      console.log('Gas cost schedule:', receipt1.receipt.gasUsed);
      console.log('Gas cost execute:', receipt2.receipt.gasUsed);
    });
  });

  describe('dependency', function () {
    beforeEach(async function () {
      this.operation1 = genOperation(
        ZERO_ADDRESS,
        0,
        web3.utils.randomHex(4),
        ZERO_BYTES32,
        web3.utils.randomHex(32),
      );
      this.operation2 = genOperation(
        ZERO_ADDRESS,
        0,
        web3.utils.randomHex(4),
        this.operation1.id,
        web3.utils.randomHex(32),
      );
      await this.tlctrl.schedule(
        this.operation1.target,
        this.operation1.value,
        this.operation1.data,
        this.operation1.predecessor,
        this.operation1.salt,
        MINDELAY,
        { from: proposer }
      );
      await this.tlctrl.schedule(
        this.operation2.target,
        this.operation2.value,
        this.operation2.data,
        this.operation2.predecessor,
        this.operation2.salt,
        MINDELAY,
        { from: proposer }
      );
      await time.increase(MINDELAY);
    });

    it('cannot execute before dependency', async function () {
      await expectRevert(
        this.tlctrl.execute(
          this.operation2.target,
          this.operation2.value,
          this.operation2.data,
          this.operation2.predecessor,
          this.operation2.salt,
          { from: executer }
        ),
        'TimelockController: missing dependency'
      );
    });

    it('can execute after dependency', async function () {
      await this.tlctrl.execute(
        this.operation1.target,
        this.operation1.value,
        this.operation1.data,
        this.operation1.predecessor,
        this.operation1.salt,
        { from: executer }
      );
      await this.tlctrl.execute(
        this.operation2.target,
        this.operation2.value,
        this.operation2.data,
        this.operation2.predecessor,
        this.operation2.salt,
        { from: executer }
      );
    });
  });

  describe('scenari', function () {
    it('call', async function () {
      const randomBN = web3.utils.toBN(web3.utils.randomHex(8)).toString();
      const operation = genOperation(
        this.implementation2.address,
        0,
        this.implementation2.contract.methods.setValue(randomBN).encodeABI(),
        ZERO_BYTES32,
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer }
      );
      await time.increase(MINDELAY);
      const receipt = await this.tlctrl.execute(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        { from: executer }
      );
      expectEvent(receipt, 'CallExecuted', {
        id: operation.id,
        index: web3.utils.toBN(0),
        target: operation.target,
        value: web3.utils.toBN(operation.value),
        data: operation.data,
      });

      expect(await this.implementation2.getValue()).to.be.bignumber.equal(randomBN);
    });

    it('call reverting', async function () {
      const operation = genOperation(
        this.callreceivermock.address,
        0,
        this.callreceivermock.contract.methods.mockFunctionRevertsNoReason().encodeABI(),
        ZERO_BYTES32,
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer }
      );
      await time.increase(MINDELAY);
      await expectRevert(
        this.tlctrl.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.predecessor,
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
        ZERO_BYTES32,
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer }
      );
      await time.increase(MINDELAY);
      await expectRevert(
        this.tlctrl.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.predecessor,
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
        ZERO_BYTES32,
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer }
      );
      await time.increase(MINDELAY);
      await expectRevert(
        this.tlctrl.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.predecessor,
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
        ZERO_BYTES32,
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer }
      );
      await time.increase(MINDELAY);

      expect(await web3.eth.getBalance(this.tlctrl.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      const receipt = await this.tlctrl.execute(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        { from: executer, value: 1 }
      );
      expectEvent(receipt, 'CallExecuted', {
        id: operation.id,
        index: web3.utils.toBN(0),
        target: operation.target,
        value: web3.utils.toBN(operation.value),
        data: operation.data,
      });

      expect(await web3.eth.getBalance(this.tlctrl.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(1));
    });

    it('call nonpayable with eth', async function () {
      const operation = genOperation(
        this.callreceivermock.address,
        1,
        this.callreceivermock.contract.methods.mockFunctionNonPayable().encodeABI(),
        ZERO_BYTES32,
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer }
      );
      await time.increase(MINDELAY);

      expect(await web3.eth.getBalance(this.tlctrl.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      await expectRevert(
        this.tlctrl.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.predecessor,
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
        ZERO_BYTES32,
        web3.utils.randomHex(32),
      );

      await this.tlctrl.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer }
      );
      await time.increase(MINDELAY);

      expect(await web3.eth.getBalance(this.tlctrl.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      await expectRevert(
        this.tlctrl.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.predecessor,
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
