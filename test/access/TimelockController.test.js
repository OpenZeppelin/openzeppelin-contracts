const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_BYTES32 } = constants;

const { expect } = require('chai');

const TimelockController = artifacts.require('TimelockController');
const CallReceiverMock = artifacts.require('CallReceiverMock');
const Implementation2 = artifacts.require('Implementation2');
const MINDELAY = time.duration.days(1);

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

contract('TimelockController', function (accounts) {
  const [ admin, proposer, executor, other ] = accounts;

  beforeEach(async function () {
    // Deploy new timelock
    this.timelock = await TimelockController.new(
      MINDELAY,
      [ proposer ],
      [ executor ],
      { from: admin },
    );
    // Mocks
    this.callreceivermock = await CallReceiverMock.new({ from: admin });
    this.implementation2 = await Implementation2.new({ from: admin });
  });

  it('initial state', async function () {
    expect(await this.timelock.getMinDelay()).to.be.bignumber.equal(MINDELAY);
  });

  describe('methods', function () {
    describe('operation hashing', function () {
      it('hashOperation', async function () {
        this.operation = genOperation(
          '0x29cebefe301c6ce1bb36b58654fea275e1cacc83',
          '0xf94fdd6e21da21d2',
          '0xa3bc5104',
          '0xba41db3be0a9929145cfe480bd0f1f003689104d275ae912099f925df424ef94',
          '0x60d9109846ab510ed75c15f979ae366a8a2ace11d34ba9788c13ac296db50e6e',
        );
        expect(await this.timelock.hashOperation(
          this.operation.target,
          this.operation.value,
          this.operation.data,
          this.operation.predecessor,
          this.operation.salt,
        )).to.be.equal(this.operation.id);
      });

      it('hashOperationBatch', async function () {
        this.operation = genOperationBatch(
          Array(8).fill('0x2d5f21620e56531c1d59c2df9b8e95d129571f71'),
          Array(8).fill('0x2b993cfce932ccee'),
          Array(8).fill('0xcf51966b'),
          '0xce8f45069cc71d25f71ba05062de1a3974f9849b004de64a70998bca9d29c2e7',
          '0x8952d74c110f72bfe5accdf828c74d53a7dfb71235dfa8a1e8c75d8576b372ff',
        );
        expect(await this.timelock.hashOperationBatch(
          this.operation.targets,
          this.operation.values,
          this.operation.datas,
          this.operation.predecessor,
          this.operation.salt,
        )).to.be.equal(this.operation.id);
      });
    });
    describe('simple', function () {
      describe('schedule', function () {
        beforeEach(async function () {
          this.operation = genOperation(
            '0x31754f590B97fD975Eb86938f18Cc304E264D2F2',
            0,
            '0x3bf92ccc',
            ZERO_BYTES32,
            '0x025e7b0be353a74631ad648c667493c0e1cd31caa4cc2d3520fdc171ea0cc726',
          );
        });

        it('proposer can schedule', async function () {
          const receipt = await this.timelock.schedule(
            this.operation.target,
            this.operation.value,
            this.operation.data,
            this.operation.predecessor,
            this.operation.salt,
            MINDELAY,
            { from: proposer },
          );
          expectEvent(receipt, 'CallScheduled', {
            id: this.operation.id,
            index: web3.utils.toBN(0),
            target: this.operation.target,
            value: web3.utils.toBN(this.operation.value),
            data: this.operation.data,
            predecessor: this.operation.predecessor,
            delay: MINDELAY,
          });

          const block = await web3.eth.getBlock(receipt.receipt.blockHash);

          expect(await this.timelock.getTimestamp(this.operation.id))
            .to.be.bignumber.equal(web3.utils.toBN(block.timestamp).add(MINDELAY));
        });

        it('prevent overwritting active operation', async function () {
          await this.timelock.schedule(
            this.operation.target,
            this.operation.value,
            this.operation.data,
            this.operation.predecessor,
            this.operation.salt,
            MINDELAY,
            { from: proposer },
          );

          await expectRevert(
            this.timelock.schedule(
              this.operation.target,
              this.operation.value,
              this.operation.data,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
              { from: proposer },
            ),
            'TimelockController: operation already scheduled',
          );
        });

        it('prevent non-proposer from commiting', async function () {
          await expectRevert(
            this.timelock.schedule(
              this.operation.target,
              this.operation.value,
              this.operation.data,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
              { from: other },
            ),
            'TimelockController: sender requires permission',
          );
        });

        it('enforce minimum delay', async function () {
          await expectRevert(
            this.timelock.schedule(
              this.operation.target,
              this.operation.value,
              this.operation.data,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY - 1,
              { from: proposer },
            ),
            'TimelockController: insufficient delay',
          );
        });
      });

      describe('execute', function () {
        beforeEach(async function () {
          this.operation = genOperation(
            '0xAe22104DCD970750610E6FE15E623468A98b15f7',
            0,
            '0x13e414de',
            ZERO_BYTES32,
            '0xc1059ed2dc130227aa1d1d539ac94c641306905c020436c636e19e3fab56fc7f',
          );
        });

        it('revert if operation is not scheduled', async function () {
          await expectRevert(
            this.timelock.execute(
              this.operation.target,
              this.operation.value,
              this.operation.data,
              this.operation.predecessor,
              this.operation.salt,
              { from: executor },
            ),
            'TimelockController: operation is not ready',
          );
        });

        describe('with scheduled operation', function () {
          beforeEach(async function () {
            ({ receipt: this.receipt, logs: this.logs } = await this.timelock.schedule(
              this.operation.target,
              this.operation.value,
              this.operation.data,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
              { from: proposer },
            ));
          });

          it('revert if execution comes too early 1/2', async function () {
            await expectRevert(
              this.timelock.execute(
                this.operation.target,
                this.operation.value,
                this.operation.data,
                this.operation.predecessor,
                this.operation.salt,
                { from: executor },
              ),
              'TimelockController: operation is not ready',
            );
          });

          it('revert if execution comes too early 2/2', async function () {
            const timestamp = await this.timelock.getTimestamp(this.operation.id);
            await time.increaseTo(timestamp - 5); // -1 is too tight, test sometime fails

            await expectRevert(
              this.timelock.execute(
                this.operation.target,
                this.operation.value,
                this.operation.data,
                this.operation.predecessor,
                this.operation.salt,
                { from: executor },
              ),
              'TimelockController: operation is not ready',
            );
          });

          describe('on time', function () {
            beforeEach(async function () {
              const timestamp = await this.timelock.getTimestamp(this.operation.id);
              await time.increaseTo(timestamp);
            });

            it('executor can reveal', async function () {
              const receipt = await this.timelock.execute(
                this.operation.target,
                this.operation.value,
                this.operation.data,
                this.operation.predecessor,
                this.operation.salt,
                { from: executor },
              );
              expectEvent(receipt, 'CallExecuted', {
                id: this.operation.id,
                index: web3.utils.toBN(0),
                target: this.operation.target,
                value: web3.utils.toBN(this.operation.value),
                data: this.operation.data,
              });
            });

            it('prevent non-executor from revealing', async function () {
              await expectRevert(
                this.timelock.execute(
                  this.operation.target,
                  this.operation.value,
                  this.operation.data,
                  this.operation.predecessor,
                  this.operation.salt,
                  { from: other },
                ),
                'TimelockController: sender requires permission',
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
            Array(8).fill('0xEd912250835c812D4516BBD80BdaEA1bB63a293C'),
            Array(8).fill(0),
            Array(8).fill('0x2fcb7a88'),
            ZERO_BYTES32,
            '0x6cf9d042ade5de78bed9ffd075eb4b2a4f6b1736932c2dc8af517d6e066f51f5',
          );
        });

        it('proposer can schedule', async function () {
          const receipt = await this.timelock.scheduleBatch(
            this.operation.targets,
            this.operation.values,
            this.operation.datas,
            this.operation.predecessor,
            this.operation.salt,
            MINDELAY,
            { from: proposer },
          );
          for (const i in this.operation.targets) {
            expectEvent(receipt, 'CallScheduled', {
              id: this.operation.id,
              index: web3.utils.toBN(i),
              target: this.operation.targets[i],
              value: web3.utils.toBN(this.operation.values[i]),
              data: this.operation.datas[i],
              predecessor: this.operation.predecessor,
              delay: MINDELAY,
            });
          }

          const block = await web3.eth.getBlock(receipt.receipt.blockHash);

          expect(await this.timelock.getTimestamp(this.operation.id))
            .to.be.bignumber.equal(web3.utils.toBN(block.timestamp).add(MINDELAY));
        });

        it('prevent overwritting active operation', async function () {
          await this.timelock.scheduleBatch(
            this.operation.targets,
            this.operation.values,
            this.operation.datas,
            this.operation.predecessor,
            this.operation.salt,
            MINDELAY,
            { from: proposer },
          );

          await expectRevert(
            this.timelock.scheduleBatch(
              this.operation.targets,
              this.operation.values,
              this.operation.datas,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
              { from: proposer },
            ),
            'TimelockController: operation already scheduled',
          );
        });

        it('prevent non-proposer from commiting', async function () {
          await expectRevert(
            this.timelock.scheduleBatch(
              this.operation.targets,
              this.operation.values,
              this.operation.datas,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
              { from: other },
            ),
            'TimelockController: sender requires permission',
          );
        });

        it('enforce minimum delay', async function () {
          await expectRevert(
            this.timelock.scheduleBatch(
              this.operation.targets,
              this.operation.values,
              this.operation.datas,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY - 1,
              { from: proposer },
            ),
            'TimelockController: insufficient delay',
          );
        });
      });

      describe('execute', function () {
        beforeEach(async function () {
          this.operation = genOperationBatch(
            Array(8).fill('0x76E53CcEb05131Ef5248553bEBDb8F70536830b1'),
            Array(8).fill(0),
            Array(8).fill('0x58a60f63'),
            ZERO_BYTES32,
            '0x9545eeabc7a7586689191f78a5532443698538e54211b5bd4d7dc0fc0102b5c7',
          );
        });

        it('revert if operation is not scheduled', async function () {
          await expectRevert(
            this.timelock.executeBatch(
              this.operation.targets,
              this.operation.values,
              this.operation.datas,
              this.operation.predecessor,
              this.operation.salt,
              { from: executor },
            ),
            'TimelockController: operation is not ready',
          );
        });

        describe('with scheduled operation', function () {
          beforeEach(async function () {
            ({ receipt: this.receipt, logs: this.logs } = await this.timelock.scheduleBatch(
              this.operation.targets,
              this.operation.values,
              this.operation.datas,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
              { from: proposer },
            ));
          });

          it('revert if execution comes too early 1/2', async function () {
            await expectRevert(
              this.timelock.executeBatch(
                this.operation.targets,
                this.operation.values,
                this.operation.datas,
                this.operation.predecessor,
                this.operation.salt,
                { from: executor },
              ),
              'TimelockController: operation is not ready',
            );
          });

          it('revert if execution comes too early 2/2', async function () {
            const timestamp = await this.timelock.getTimestamp(this.operation.id);
            await time.increaseTo(timestamp - 5); // -1 is to tight, test sometime fails

            await expectRevert(
              this.timelock.executeBatch(
                this.operation.targets,
                this.operation.values,
                this.operation.datas,
                this.operation.predecessor,
                this.operation.salt,
                { from: executor },
              ),
              'TimelockController: operation is not ready',
            );
          });

          describe('on time', function () {
            beforeEach(async function () {
              const timestamp = await this.timelock.getTimestamp(this.operation.id);
              await time.increaseTo(timestamp);
            });

            it('executor can reveal', async function () {
              const receipt = await this.timelock.executeBatch(
                this.operation.targets,
                this.operation.values,
                this.operation.datas,
                this.operation.predecessor,
                this.operation.salt,
                { from: executor },
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

            it('prevent non-executor from revealing', async function () {
              await expectRevert(
                this.timelock.executeBatch(
                  this.operation.targets,
                  this.operation.values,
                  this.operation.datas,
                  this.operation.predecessor,
                  this.operation.salt,
                  { from: other },
                ),
                'TimelockController: sender requires permission',
              );
            });

            it('length mismatch #1', async function () {
              await expectRevert(
                this.timelock.executeBatch(
                  [],
                  this.operation.values,
                  this.operation.datas,
                  this.operation.predecessor,
                  this.operation.salt,
                  { from: executor },
                ),
                'TimelockController: length mismatch',
              );
            });

            it('length mismatch #2', async function () {
              await expectRevert(
                this.timelock.executeBatch(
                  this.operation.targets,
                  [],
                  this.operation.datas,
                  this.operation.predecessor,
                  this.operation.salt,
                  { from: executor },
                ),
                'TimelockController: length mismatch',
              );
            });

            it('length mismatch #3', async function () {
              await expectRevert(
                this.timelock.executeBatch(
                  this.operation.targets,
                  this.operation.values,
                  [],
                  this.operation.predecessor,
                  this.operation.salt,
                  { from: executor },
                ),
                'TimelockController: length mismatch',
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
            '0x8ac04aa0d6d66b8812fb41d39638d37af0a9ab11da507afd65c509f8ed079d3e',
          );

          await this.timelock.scheduleBatch(
            operation.targets,
            operation.values,
            operation.datas,
            operation.predecessor,
            operation.salt,
            MINDELAY,
            { from: proposer },
          );
          await time.increase(MINDELAY);
          await expectRevert(
            this.timelock.executeBatch(
              operation.targets,
              operation.values,
              operation.datas,
              operation.predecessor,
              operation.salt,
              { from: executor },
            ),
            'TimelockController: underlying transaction reverted',
          );
        });
      });
    });

    describe('cancel', function () {
      beforeEach(async function () {
        this.operation = genOperation(
          '0xC6837c44AA376dbe1d2709F13879E040CAb653ca',
          0,
          '0x296e58dd',
          ZERO_BYTES32,
          '0xa2485763600634800df9fc9646fb2c112cf98649c55f63dd1d9c7d13a64399d9',
        );
        ({ receipt: this.receipt, logs: this.logs } = await this.timelock.schedule(
          this.operation.target,
          this.operation.value,
          this.operation.data,
          this.operation.predecessor,
          this.operation.salt,
          MINDELAY,
          { from: proposer },
        ));
      });

      it('proposer can cancel', async function () {
        const receipt = await this.timelock.cancel(this.operation.id, { from: proposer });
        expectEvent(receipt, 'Cancelled', { id: this.operation.id });
      });

      it('prevent non-proposer from canceling', async function () {
        await expectRevert(
          this.timelock.cancel(this.operation.id, { from: other }),
          'TimelockController: sender requires permission',
        );
      });
    });
  });

  describe('maintenance', function () {
    it('prevent unauthorized maintenance', async function () {
      await expectRevert(
        this.timelock.updateDelay(0, { from: other }),
        'TimelockController: caller must be timelock',
      );
    });

    it('timelock scheduled maintenance', async function () {
      const newDelay = time.duration.hours(6);
      const operation = genOperation(
        this.timelock.address,
        0,
        this.timelock.contract.methods.updateDelay(newDelay.toString()).encodeABI(),
        ZERO_BYTES32,
        '0xf8e775b2c5f4d66fb5c7fa800f35ef518c262b6014b3c0aee6ea21bff157f108',
      );

      await this.timelock.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer },
      );
      await time.increase(MINDELAY);
      const receipt = await this.timelock.execute(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        { from: executor },
      );
      expectEvent(receipt, 'MinDelayChange', { newDuration: newDelay.toString(), oldDuration: MINDELAY });

      expect(await this.timelock.getMinDelay()).to.be.bignumber.equal(newDelay);
    });
  });

  describe('dependency', function () {
    beforeEach(async function () {
      this.operation1 = genOperation(
        '0xdE66bD4c97304200A95aE0AadA32d6d01A867E39',
        0,
        '0x01dc731a',
        ZERO_BYTES32,
        '0x64e932133c7677402ead2926f86205e2ca4686aebecf5a8077627092b9bb2feb',
      );
      this.operation2 = genOperation(
        '0x3c7944a3F1ee7fc8c5A5134ba7c79D11c3A1FCa3',
        0,
        '0x8f531849',
        this.operation1.id,
        '0x036e1311cac523f9548e6461e29fb1f8f9196b91910a41711ea22f5de48df07d',
      );
      await this.timelock.schedule(
        this.operation1.target,
        this.operation1.value,
        this.operation1.data,
        this.operation1.predecessor,
        this.operation1.salt,
        MINDELAY,
        { from: proposer },
      );
      await this.timelock.schedule(
        this.operation2.target,
        this.operation2.value,
        this.operation2.data,
        this.operation2.predecessor,
        this.operation2.salt,
        MINDELAY,
        { from: proposer },
      );
      await time.increase(MINDELAY);
    });

    it('cannot execute before dependency', async function () {
      await expectRevert(
        this.timelock.execute(
          this.operation2.target,
          this.operation2.value,
          this.operation2.data,
          this.operation2.predecessor,
          this.operation2.salt,
          { from: executor },
        ),
        'TimelockController: missing dependency',
      );
    });

    it('can execute after dependency', async function () {
      await this.timelock.execute(
        this.operation1.target,
        this.operation1.value,
        this.operation1.data,
        this.operation1.predecessor,
        this.operation1.salt,
        { from: executor },
      );
      await this.timelock.execute(
        this.operation2.target,
        this.operation2.value,
        this.operation2.data,
        this.operation2.predecessor,
        this.operation2.salt,
        { from: executor },
      );
    });
  });

  describe('usage scenario', function () {
    this.timeout(10000);

    it('call', async function () {
      const operation = genOperation(
        this.implementation2.address,
        0,
        this.implementation2.contract.methods.setValue(42).encodeABI(),
        ZERO_BYTES32,
        '0x8043596363daefc89977b25f9d9b4d06c3910959ef0c4d213557a903e1b555e2',
      );

      await this.timelock.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer },
      );
      await time.increase(MINDELAY);
      await this.timelock.execute(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        { from: executor },
      );

      expect(await this.implementation2.getValue()).to.be.bignumber.equal(web3.utils.toBN(42));
    });

    it('call reverting', async function () {
      const operation = genOperation(
        this.callreceivermock.address,
        0,
        this.callreceivermock.contract.methods.mockFunctionRevertsNoReason().encodeABI(),
        ZERO_BYTES32,
        '0xb1b1b276fdf1a28d1e00537ea73b04d56639128b08063c1a2f70a52e38cba693',
      );

      await this.timelock.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer },
      );
      await time.increase(MINDELAY);
      await expectRevert(
        this.timelock.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.predecessor,
          operation.salt,
          { from: executor },
        ),
        'TimelockController: underlying transaction reverted',
      );
    });

    it('call throw', async function () {
      const operation = genOperation(
        this.callreceivermock.address,
        0,
        this.callreceivermock.contract.methods.mockFunctionThrows().encodeABI(),
        ZERO_BYTES32,
        '0xe5ca79f295fc8327ee8a765fe19afb58f4a0cbc5053642bfdd7e73bc68e0fc67',
      );

      await this.timelock.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer },
      );
      await time.increase(MINDELAY);
      await expectRevert(
        this.timelock.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.predecessor,
          operation.salt,
          { from: executor },
        ),
        'TimelockController: underlying transaction reverted',
      );
    });

    it('call out of gas', async function () {
      const operation = genOperation(
        this.callreceivermock.address,
        0,
        this.callreceivermock.contract.methods.mockFunctionOutOfGas().encodeABI(),
        ZERO_BYTES32,
        '0xf3274ce7c394c5b629d5215723563a744b817e1730cca5587c567099a14578fd',
      );

      await this.timelock.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer },
      );
      await time.increase(MINDELAY);
      await expectRevert(
        this.timelock.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.predecessor,
          operation.salt,
          { from: executor, gas: '70000' },
        ),
        'TimelockController: underlying transaction reverted',
      );
    });

    it('call payable with eth', async function () {
      const operation = genOperation(
        this.callreceivermock.address,
        1,
        this.callreceivermock.contract.methods.mockFunction().encodeABI(),
        ZERO_BYTES32,
        '0x5ab73cd33477dcd36c1e05e28362719d0ed59a7b9ff14939de63a43073dc1f44',
      );

      await this.timelock.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer },
      );
      await time.increase(MINDELAY);

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      await this.timelock.execute(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        { from: executor, value: 1 },
      );

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(1));
    });

    it('call nonpayable with eth', async function () {
      const operation = genOperation(
        this.callreceivermock.address,
        1,
        this.callreceivermock.contract.methods.mockFunctionNonPayable().encodeABI(),
        ZERO_BYTES32,
        '0xb78edbd920c7867f187e5aa6294ae5a656cfbf0dea1ccdca3751b740d0f2bdf8',
      );

      await this.timelock.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer },
      );
      await time.increase(MINDELAY);

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      await expectRevert(
        this.timelock.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.predecessor,
          operation.salt,
          { from: executor },
        ),
        'TimelockController: underlying transaction reverted',
      );

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
    });

    it('call reverting with eth', async function () {
      const operation = genOperation(
        this.callreceivermock.address,
        1,
        this.callreceivermock.contract.methods.mockFunctionRevertsNoReason().encodeABI(),
        ZERO_BYTES32,
        '0xdedb4563ef0095db01d81d3f2decf57cf83e4a72aa792af14c43a792b56f4de6',
      );

      await this.timelock.schedule(
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        MINDELAY,
        { from: proposer },
      );
      await time.increase(MINDELAY);

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      await expectRevert(
        this.timelock.execute(
          operation.target,
          operation.value,
          operation.data,
          operation.predecessor,
          operation.salt,
          { from: executor },
        ),
        'TimelockController: underlying transaction reverted',
      );

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
    });
  });
});
