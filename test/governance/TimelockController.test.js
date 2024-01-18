const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

const { GovernorHelper } = require('../helpers/governance');
const { OperationState } = require('../helpers/enums');
const time = require('../helpers/time');

const { shouldSupportInterfaces } = require('../utils/introspection/SupportsInterface.behavior');

const salt = '0x025e7b0be353a74631ad648c667493c0e1cd31caa4cc2d3520fdc171ea0cc726'; // a random value

const MINDELAY = time.duration.days(1);
const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
const PROPOSER_ROLE = ethers.id('PROPOSER_ROLE');
const EXECUTOR_ROLE = ethers.id('EXECUTOR_ROLE');
const CANCELLER_ROLE = ethers.id('CANCELLER_ROLE');

const getAddress = obj => obj.address ?? obj.target ?? obj;

function genOperation(target, value, data, predecessor, salt) {
  const id = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256', 'bytes', 'uint256', 'bytes32'],
      [getAddress(target), value, data, predecessor, salt],
    ),
  );
  return { id, target, value, data, predecessor, salt };
}

function genOperationBatch(targets, values, payloads, predecessor, salt) {
  const id = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address[]', 'uint256[]', 'bytes[]', 'uint256', 'bytes32'],
      [targets.map(getAddress), values, payloads, predecessor, salt],
    ),
  );
  return { id, targets, values, payloads, predecessor, salt };
}

async function fixture() {
  const [admin, proposer, canceller, executor, other] = await ethers.getSigners();

  const mock = await ethers.deployContract('TimelockController', [MINDELAY, [proposer], [executor], admin]);
  const callreceivermock = await ethers.deployContract('CallReceiverMock');
  const implementation2 = await ethers.deployContract('Implementation2');

  expect(await mock.hasRole(CANCELLER_ROLE, proposer)).to.be.true;
  await mock.connect(admin).revokeRole(CANCELLER_ROLE, proposer);
  await mock.connect(admin).grantRole(CANCELLER_ROLE, canceller);

  return {
    admin,
    proposer,
    canceller,
    executor,
    other,
    mock,
    callreceivermock,
    implementation2,
  };
}

describe('TimelockController', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldSupportInterfaces(['ERC1155Receiver']);

  it('initial state', async function () {
    expect(await this.mock.getMinDelay()).to.equal(MINDELAY);

    expect(await this.mock.DEFAULT_ADMIN_ROLE()).to.equal(DEFAULT_ADMIN_ROLE);
    expect(await this.mock.PROPOSER_ROLE()).to.equal(PROPOSER_ROLE);
    expect(await this.mock.EXECUTOR_ROLE()).to.equal(EXECUTOR_ROLE);
    expect(await this.mock.CANCELLER_ROLE()).to.equal(CANCELLER_ROLE);

    expect(
      await Promise.all(
        [PROPOSER_ROLE, CANCELLER_ROLE, EXECUTOR_ROLE].map(role => this.mock.hasRole(role, this.proposer)),
      ),
    ).to.deep.equal([true, false, false]);

    expect(
      await Promise.all(
        [PROPOSER_ROLE, CANCELLER_ROLE, EXECUTOR_ROLE].map(role => this.mock.hasRole(role, this.canceller)),
      ),
    ).to.deep.equal([false, true, false]);

    expect(
      await Promise.all(
        [PROPOSER_ROLE, CANCELLER_ROLE, EXECUTOR_ROLE].map(role => this.mock.hasRole(role, this.executor)),
      ),
    ).to.deep.equal([false, false, true]);
  });

  it('optional admin', async function () {
    const mock = await ethers.deployContract('TimelockController', [
      MINDELAY,
      [this.proposer],
      [this.executor],
      ethers.ZeroAddress,
    ]);
    expect(await mock.hasRole(DEFAULT_ADMIN_ROLE, this.admin)).to.be.false;
    expect(await mock.hasRole(DEFAULT_ADMIN_ROLE, mock.target)).to.be.true;
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
        expect(
          await this.mock.hashOperation(
            this.operation.target,
            this.operation.value,
            this.operation.data,
            this.operation.predecessor,
            this.operation.salt,
          ),
        ).to.equal(this.operation.id);
      });

      it('hashOperationBatch', async function () {
        this.operation = genOperationBatch(
          Array(8).fill('0x2d5f21620e56531c1d59c2df9b8e95d129571f71'),
          Array(8).fill('0x2b993cfce932ccee'),
          Array(8).fill('0xcf51966b'),
          '0xce8f45069cc71d25f71ba05062de1a3974f9849b004de64a70998bca9d29c2e7',
          '0x8952d74c110f72bfe5accdf828c74d53a7dfb71235dfa8a1e8c75d8576b372ff',
        );
        expect(
          await this.mock.hashOperationBatch(
            this.operation.targets,
            this.operation.values,
            this.operation.payloads,
            this.operation.predecessor,
            this.operation.salt,
          ),
        ).to.equal(this.operation.id);
      });
    });
    describe('simple', function () {
      describe('schedule', function () {
        beforeEach(async function () {
          this.operation = genOperation(
            '0x31754f590B97fD975Eb86938f18Cc304E264D2F2',
            0n,
            '0x3bf92ccc',
            ethers.ZeroHash,
            salt,
          );
        });

        it('proposer can schedule', async function () {
          const tx = await this.mock
            .connect(this.proposer)
            .schedule(
              this.operation.target,
              this.operation.value,
              this.operation.data,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
            );

          expect(tx)
            .to.emit(this.mock, 'CallScheduled')
            .withArgs(
              this.operation.id,
              0n,
              this.operation.target,
              this.operation.value,
              this.operation.data,
              this.operation.predecessor,
              MINDELAY,
            )
            .to.emit(this.mock, 'CallSalt')
            .withArgs(this.operation.id, this.operation.salt);

          expect(await this.mock.getTimestamp(this.operation.id)).to.equal(
            (await time.clockFromReceipt.timestamp(tx)) + MINDELAY,
          );
        });

        it('prevent overwriting active operation', async function () {
          await this.mock
            .connect(this.proposer)
            .schedule(
              this.operation.target,
              this.operation.value,
              this.operation.data,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
            );

          await expect(
            this.mock
              .connect(this.proposer)
              .schedule(
                this.operation.target,
                this.operation.value,
                this.operation.data,
                this.operation.predecessor,
                this.operation.salt,
                MINDELAY,
              ),
          )
            .to.be.revertedWithCustomError(this.mock, 'TimelockUnexpectedOperationState')
            .withArgs(this.operation.id, GovernorHelper.proposalStatesToBitMap(OperationState.Unset));
        });

        it('prevent non-proposer from committing', async function () {
          await expect(
            this.mock
              .connect(this.other)
              .schedule(
                this.operation.target,
                this.operation.value,
                this.operation.data,
                this.operation.predecessor,
                this.operation.salt,
                MINDELAY,
              ),
          )
            .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
            .withArgs(this.other, PROPOSER_ROLE);
        });

        it('enforce minimum delay', async function () {
          await expect(
            this.mock
              .connect(this.proposer)
              .schedule(
                this.operation.target,
                this.operation.value,
                this.operation.data,
                this.operation.predecessor,
                this.operation.salt,
                MINDELAY - 1n,
              ),
          )
            .to.be.revertedWithCustomError(this.mock, 'TimelockInsufficientDelay')
            .withArgs(MINDELAY - 1n, MINDELAY);
        });

        it('schedule operation with salt zero', async function () {
          await expect(
            this.mock
              .connect(this.proposer)
              .schedule(
                this.operation.target,
                this.operation.value,
                this.operation.data,
                this.operation.predecessor,
                ethers.ZeroHash,
                MINDELAY,
              ),
          ).to.not.emit(this.mock, 'CallSalt');
        });
      });

      describe('execute', function () {
        beforeEach(async function () {
          this.operation = genOperation(
            '0xAe22104DCD970750610E6FE15E623468A98b15f7',
            0n,
            '0x13e414de',
            ethers.ZeroHash,
            '0xc1059ed2dc130227aa1d1d539ac94c641306905c020436c636e19e3fab56fc7f',
          );
        });

        it('revert if operation is not scheduled', async function () {
          await expect(
            this.mock
              .connect(this.executor)
              .execute(
                this.operation.target,
                this.operation.value,
                this.operation.data,
                this.operation.predecessor,
                this.operation.salt,
              ),
          )
            .to.be.revertedWithCustomError(this.mock, 'TimelockUnexpectedOperationState')
            .withArgs(this.operation.id, GovernorHelper.proposalStatesToBitMap(OperationState.Ready));
        });

        describe('with scheduled operation', function () {
          beforeEach(async function () {
            await this.mock
              .connect(this.proposer)
              .schedule(
                this.operation.target,
                this.operation.value,
                this.operation.data,
                this.operation.predecessor,
                this.operation.salt,
                MINDELAY,
              );
          });

          it('revert if execution comes too early 1/2', async function () {
            await expect(
              this.mock
                .connect(this.executor)
                .execute(
                  this.operation.target,
                  this.operation.value,
                  this.operation.data,
                  this.operation.predecessor,
                  this.operation.salt,
                ),
            )
              .to.be.revertedWithCustomError(this.mock, 'TimelockUnexpectedOperationState')
              .withArgs(this.operation.id, GovernorHelper.proposalStatesToBitMap(OperationState.Ready));
          });

          it('revert if execution comes too early 2/2', async function () {
            // -1 is too tight, test sometime fails
            await this.mock.getTimestamp(this.operation.id).then(clock => time.increaseTo.timestamp(clock - 5n));

            await expect(
              this.mock
                .connect(this.executor)
                .execute(
                  this.operation.target,
                  this.operation.value,
                  this.operation.data,
                  this.operation.predecessor,
                  this.operation.salt,
                ),
            )
              .to.be.revertedWithCustomError(this.mock, 'TimelockUnexpectedOperationState')
              .withArgs(this.operation.id, GovernorHelper.proposalStatesToBitMap(OperationState.Ready));
          });

          describe('on time', function () {
            beforeEach(async function () {
              await this.mock.getTimestamp(this.operation.id).then(time.increaseTo.timestamp);
            });

            it('executor can reveal', async function () {
              await expect(
                this.mock
                  .connect(this.executor)
                  .execute(
                    this.operation.target,
                    this.operation.value,
                    this.operation.data,
                    this.operation.predecessor,
                    this.operation.salt,
                  ),
              )
                .to.emit(this.mock, 'CallExecuted')
                .withArgs(this.operation.id, 0n, this.operation.target, this.operation.value, this.operation.data);
            });

            it('prevent non-executor from revealing', async function () {
              await expect(
                this.mock
                  .connect(this.other)
                  .execute(
                    this.operation.target,
                    this.operation.value,
                    this.operation.data,
                    this.operation.predecessor,
                    this.operation.salt,
                  ),
              )
                .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
                .withArgs(this.other, EXECUTOR_ROLE);
            });

            it('prevents reentrancy execution', async function () {
              // Create operation
              const reentrant = await ethers.deployContract('$TimelockReentrant');
              const reentrantOperation = genOperation(
                reentrant,
                0n,
                reentrant.interface.encodeFunctionData('reenter'),
                ethers.ZeroHash,
                salt,
              );

              // Schedule so it can be executed
              await this.mock
                .connect(this.proposer)
                .schedule(
                  reentrantOperation.target,
                  reentrantOperation.value,
                  reentrantOperation.data,
                  reentrantOperation.predecessor,
                  reentrantOperation.salt,
                  MINDELAY,
                );

              // Advance on time to make the operation executable
              await this.mock.getTimestamp(reentrantOperation.id).then(time.increaseTo.timestamp);

              // Grant executor role to the reentrant contract
              await this.mock.connect(this.admin).grantRole(EXECUTOR_ROLE, reentrant);

              // Prepare reenter
              const data = this.mock.interface.encodeFunctionData('execute', [
                getAddress(reentrantOperation.target),
                reentrantOperation.value,
                reentrantOperation.data,
                reentrantOperation.predecessor,
                reentrantOperation.salt,
              ]);
              await reentrant.enableRentrancy(this.mock, data);

              // Expect to fail
              await expect(
                this.mock
                  .connect(this.executor)
                  .execute(
                    reentrantOperation.target,
                    reentrantOperation.value,
                    reentrantOperation.data,
                    reentrantOperation.predecessor,
                    reentrantOperation.salt,
                  ),
              )
                .to.be.revertedWithCustomError(this.mock, 'TimelockUnexpectedOperationState')
                .withArgs(reentrantOperation.id, GovernorHelper.proposalStatesToBitMap(OperationState.Ready));

              // Disable reentrancy
              await reentrant.disableReentrancy();
              const nonReentrantOperation = reentrantOperation; // Not anymore

              // Try again successfully
              await expect(
                this.mock
                  .connect(this.executor)
                  .execute(
                    nonReentrantOperation.target,
                    nonReentrantOperation.value,
                    nonReentrantOperation.data,
                    nonReentrantOperation.predecessor,
                    nonReentrantOperation.salt,
                  ),
              )
                .to.emit(this.mock, 'CallExecuted')
                .withArgs(
                  nonReentrantOperation.id,
                  0n,
                  getAddress(nonReentrantOperation),
                  nonReentrantOperation.value,
                  nonReentrantOperation.data,
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
            Array(8).fill(0n),
            Array(8).fill('0x2fcb7a88'),
            ethers.ZeroHash,
            '0x6cf9d042ade5de78bed9ffd075eb4b2a4f6b1736932c2dc8af517d6e066f51f5',
          );
        });

        it('proposer can schedule', async function () {
          const tx = this.mock
            .connect(this.proposer)
            .scheduleBatch(
              this.operation.targets,
              this.operation.values,
              this.operation.payloads,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
            );
          for (const i in this.operation.targets) {
            await expect(tx)
              .to.emit(this.mock, 'CallScheduled')
              .withArgs(
                this.operation.id,
                i,
                getAddress(this.operation.targets[i]),
                this.operation.values[i],
                this.operation.payloads[i],
                this.operation.predecessor,
                MINDELAY,
              )
              .to.emit(this.mock, 'CallSalt')
              .withArgs(this.operation.id, this.operation.salt);
          }

          expect(await this.mock.getTimestamp(this.operation.id)).to.equal(
            (await time.clockFromReceipt.timestamp(tx)) + MINDELAY,
          );
        });

        it('prevent overwriting active operation', async function () {
          await this.mock
            .connect(this.proposer)
            .scheduleBatch(
              this.operation.targets,
              this.operation.values,
              this.operation.payloads,
              this.operation.predecessor,
              this.operation.salt,
              MINDELAY,
            );

          await expect(
            this.mock
              .connect(this.proposer)
              .scheduleBatch(
                this.operation.targets,
                this.operation.values,
                this.operation.payloads,
                this.operation.predecessor,
                this.operation.salt,
                MINDELAY,
              ),
          )
            .to.be.revertedWithCustomError(this.mock, 'TimelockUnexpectedOperationState')
            .withArgs(this.operation.id, GovernorHelper.proposalStatesToBitMap(OperationState.Unset));
        });

        it('length of batch parameter must match #1', async function () {
          await expect(
            this.mock
              .connect(this.proposer)
              .scheduleBatch(
                this.operation.targets,
                [],
                this.operation.payloads,
                this.operation.predecessor,
                this.operation.salt,
                MINDELAY,
              ),
          )
            .to.be.revertedWithCustomError(this.mock, 'TimelockInvalidOperationLength')
            .withArgs(this.operation.targets.length, this.operation.payloads.length, 0n);
        });

        it('length of batch parameter must match #1', async function () {
          await expect(
            this.mock
              .connect(this.proposer)
              .scheduleBatch(
                this.operation.targets,
                this.operation.values,
                [],
                this.operation.predecessor,
                this.operation.salt,
                MINDELAY,
              ),
          )
            .to.be.revertedWithCustomError(this.mock, 'TimelockInvalidOperationLength')
            .withArgs(this.operation.targets.length, 0n, this.operation.payloads.length);
        });

        it('prevent non-proposer from committing', async function () {
          await expect(
            this.mock
              .connect(this.other)
              .scheduleBatch(
                this.operation.targets,
                this.operation.values,
                this.operation.payloads,
                this.operation.predecessor,
                this.operation.salt,
                MINDELAY,
              ),
          )
            .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
            .withArgs(this.other, PROPOSER_ROLE);
        });

        it('enforce minimum delay', async function () {
          await expect(
            this.mock
              .connect(this.proposer)
              .scheduleBatch(
                this.operation.targets,
                this.operation.values,
                this.operation.payloads,
                this.operation.predecessor,
                this.operation.salt,
                MINDELAY - 1n,
              ),
          )
            .to.be.revertedWithCustomError(this.mock, 'TimelockInsufficientDelay')
            .withArgs(MINDELAY - 1n, MINDELAY);
        });
      });

      describe('execute', function () {
        beforeEach(async function () {
          this.operation = genOperationBatch(
            Array(8).fill('0x76E53CcEb05131Ef5248553bEBDb8F70536830b1'),
            Array(8).fill(0n),
            Array(8).fill('0x58a60f63'),
            ethers.ZeroHash,
            '0x9545eeabc7a7586689191f78a5532443698538e54211b5bd4d7dc0fc0102b5c7',
          );
        });

        it('revert if operation is not scheduled', async function () {
          await expect(
            this.mock
              .connect(this.executor)
              .executeBatch(
                this.operation.targets,
                this.operation.values,
                this.operation.payloads,
                this.operation.predecessor,
                this.operation.salt,
              ),
          )
            .to.be.revertedWithCustomError(this.mock, 'TimelockUnexpectedOperationState')
            .withArgs(this.operation.id, GovernorHelper.proposalStatesToBitMap(OperationState.Ready));
        });

        describe('with scheduled operation', function () {
          beforeEach(async function () {
            await this.mock
              .connect(this.proposer)
              .scheduleBatch(
                this.operation.targets,
                this.operation.values,
                this.operation.payloads,
                this.operation.predecessor,
                this.operation.salt,
                MINDELAY,
              );
          });

          it('revert if execution comes too early 1/2', async function () {
            await expect(
              this.mock
                .connect(this.executor)
                .executeBatch(
                  this.operation.targets,
                  this.operation.values,
                  this.operation.payloads,
                  this.operation.predecessor,
                  this.operation.salt,
                ),
            )
              .to.be.revertedWithCustomError(this.mock, 'TimelockUnexpectedOperationState')
              .withArgs(this.operation.id, GovernorHelper.proposalStatesToBitMap(OperationState.Ready));
          });

          it('revert if execution comes too early 2/2', async function () {
            // -1 is to tight, test sometime fails
            await this.mock.getTimestamp(this.operation.id).then(clock => time.increaseTo.timestamp(clock - 5n));

            await expect(
              this.mock
                .connect(this.executor)
                .executeBatch(
                  this.operation.targets,
                  this.operation.values,
                  this.operation.payloads,
                  this.operation.predecessor,
                  this.operation.salt,
                ),
            )
              .to.be.revertedWithCustomError(this.mock, 'TimelockUnexpectedOperationState')
              .withArgs(this.operation.id, GovernorHelper.proposalStatesToBitMap(OperationState.Ready));
          });

          describe('on time', function () {
            beforeEach(async function () {
              await this.mock.getTimestamp(this.operation.id).then(time.increaseTo.timestamp);
            });

            it('executor can reveal', async function () {
              const tx = this.mock
                .connect(this.executor)
                .executeBatch(
                  this.operation.targets,
                  this.operation.values,
                  this.operation.payloads,
                  this.operation.predecessor,
                  this.operation.salt,
                );
              for (const i in this.operation.targets) {
                expect(tx)
                  .to.emit(this.mock, 'CallExecuted')
                  .withArgs(
                    this.operation.id,
                    i,
                    this.operation.targets[i],
                    this.operation.values[i],
                    this.operation.payloads[i],
                  );
              }
            });

            it('prevent non-executor from revealing', async function () {
              await expect(
                this.mock
                  .connect(this.other)
                  .executeBatch(
                    this.operation.targets,
                    this.operation.values,
                    this.operation.payloads,
                    this.operation.predecessor,
                    this.operation.salt,
                  ),
              )
                .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
                .withArgs(this.other, EXECUTOR_ROLE);
            });

            it('length mismatch #1', async function () {
              await expect(
                this.mock
                  .connect(this.executor)
                  .executeBatch(
                    [],
                    this.operation.values,
                    this.operation.payloads,
                    this.operation.predecessor,
                    this.operation.salt,
                  ),
              )
                .to.be.revertedWithCustomError(this.mock, 'TimelockInvalidOperationLength')
                .withArgs(0, this.operation.payloads.length, this.operation.values.length);
            });

            it('length mismatch #2', async function () {
              await expect(
                this.mock
                  .connect(this.executor)
                  .executeBatch(
                    this.operation.targets,
                    [],
                    this.operation.payloads,
                    this.operation.predecessor,
                    this.operation.salt,
                  ),
              )
                .to.be.revertedWithCustomError(this.mock, 'TimelockInvalidOperationLength')
                .withArgs(this.operation.targets.length, this.operation.payloads.length, 0n);
            });

            it('length mismatch #3', async function () {
              await expect(
                this.mock
                  .connect(this.executor)
                  .executeBatch(
                    this.operation.targets,
                    this.operation.values,
                    [],
                    this.operation.predecessor,
                    this.operation.salt,
                  ),
              )
                .to.be.revertedWithCustomError(this.mock, 'TimelockInvalidOperationLength')
                .withArgs(this.operation.targets.length, 0n, this.operation.values.length);
            });

            it('prevents reentrancy execution', async function () {
              // Create operation
              const reentrant = await ethers.deployContract('$TimelockReentrant');
              const reentrantBatchOperation = genOperationBatch(
                [reentrant],
                [0n],
                [reentrant.interface.encodeFunctionData('reenter')],
                ethers.ZeroHash,
                salt,
              );

              // Schedule so it can be executed
              await this.mock
                .connect(this.proposer)
                .scheduleBatch(
                  reentrantBatchOperation.targets,
                  reentrantBatchOperation.values,
                  reentrantBatchOperation.payloads,
                  reentrantBatchOperation.predecessor,
                  reentrantBatchOperation.salt,
                  MINDELAY,
                );

              // Advance on time to make the operation executable
              await this.mock.getTimestamp(reentrantBatchOperation.id).then(time.increaseTo.timestamp);

              // Grant executor role to the reentrant contract
              await this.mock.connect(this.admin).grantRole(EXECUTOR_ROLE, reentrant);

              // Prepare reenter
              const data = this.mock.interface.encodeFunctionData('executeBatch', [
                reentrantBatchOperation.targets.map(getAddress),
                reentrantBatchOperation.values,
                reentrantBatchOperation.payloads,
                reentrantBatchOperation.predecessor,
                reentrantBatchOperation.salt,
              ]);
              await reentrant.enableRentrancy(this.mock, data);

              // Expect to fail
              await expect(
                this.mock
                  .connect(this.executor)
                  .executeBatch(
                    reentrantBatchOperation.targets,
                    reentrantBatchOperation.values,
                    reentrantBatchOperation.payloads,
                    reentrantBatchOperation.predecessor,
                    reentrantBatchOperation.salt,
                  ),
              )
                .to.be.revertedWithCustomError(this.mock, 'TimelockUnexpectedOperationState')
                .withArgs(reentrantBatchOperation.id, GovernorHelper.proposalStatesToBitMap(OperationState.Ready));

              // Disable reentrancy
              await reentrant.disableReentrancy();
              const nonReentrantBatchOperation = reentrantBatchOperation; // Not anymore

              // Try again successfully
              const tx = this.mock
                .connect(this.executor)
                .executeBatch(
                  nonReentrantBatchOperation.targets,
                  nonReentrantBatchOperation.values,
                  nonReentrantBatchOperation.payloads,
                  nonReentrantBatchOperation.predecessor,
                  nonReentrantBatchOperation.salt,
                );
              for (const i in nonReentrantBatchOperation.targets) {
                expect(tx)
                  .to.emit(this.mock, 'CallExecuted')
                  .withArgs(
                    nonReentrantBatchOperation.id,
                    i,
                    nonReentrantBatchOperation.targets[i],
                    nonReentrantBatchOperation.values[i],
                    nonReentrantBatchOperation.payloads[i],
                  );
              }
            });
          });
        });

        it('partial execution', async function () {
          const operation = genOperationBatch(
            [this.callreceivermock, this.callreceivermock, this.callreceivermock],
            [0n, 0n, 0n],
            [
              this.callreceivermock.interface.encodeFunctionData('mockFunction'),
              this.callreceivermock.interface.encodeFunctionData('mockFunctionRevertsNoReason'),
              this.callreceivermock.interface.encodeFunctionData('mockFunction'),
            ],
            ethers.ZeroHash,
            '0x8ac04aa0d6d66b8812fb41d39638d37af0a9ab11da507afd65c509f8ed079d3e',
          );

          await this.mock
            .connect(this.proposer)
            .scheduleBatch(
              operation.targets,
              operation.values,
              operation.payloads,
              operation.predecessor,
              operation.salt,
              MINDELAY,
            );

          await this.mock.getTimestamp(operation.id).then(time.increaseTo.timestamp);

          await expect(
            this.mock
              .connect(this.executor)
              .executeBatch(
                operation.targets,
                operation.values,
                operation.payloads,
                operation.predecessor,
                operation.salt,
              ),
          ).to.be.revertedWithCustomError(this.mock, 'FailedInnerCall');
        });
      });
    });

    describe('cancel', function () {
      beforeEach(async function () {
        this.operation = genOperation(
          '0xC6837c44AA376dbe1d2709F13879E040CAb653ca',
          0n,
          '0x296e58dd',
          ethers.ZeroHash,
          '0xa2485763600634800df9fc9646fb2c112cf98649c55f63dd1d9c7d13a64399d9',
        );
        await this.mock
          .connect(this.proposer)
          .schedule(
            this.operation.target,
            this.operation.value,
            this.operation.data,
            this.operation.predecessor,
            this.operation.salt,
            MINDELAY,
          );
      });

      it('canceller can cancel', async function () {
        await expect(this.mock.connect(this.canceller).cancel(this.operation.id))
          .to.emit(this.mock, 'Cancelled')
          .withArgs(this.operation.id);
      });

      it('cannot cancel invalid operation', async function () {
        await expect(this.mock.connect(this.canceller).cancel(ethers.ZeroHash))
          .to.be.revertedWithCustomError(this.mock, 'TimelockUnexpectedOperationState')
          .withArgs(
            ethers.ZeroHash,
            GovernorHelper.proposalStatesToBitMap([OperationState.Waiting, OperationState.Ready]),
          );
      });

      it('prevent non-canceller from canceling', async function () {
        await expect(this.mock.connect(this.other).cancel(this.operation.id))
          .to.be.revertedWithCustomError(this.mock, 'AccessControlUnauthorizedAccount')
          .withArgs(this.other, CANCELLER_ROLE);
      });
    });
  });

  describe('maintenance', function () {
    it('prevent unauthorized maintenance', async function () {
      await expect(this.mock.connect(this.other).updateDelay(0n))
        .to.be.revertedWithCustomError(this.mock, 'TimelockUnauthorizedCaller')
        .withArgs(this.other);
    });

    it('timelock scheduled maintenance', async function () {
      const newDelay = time.duration.hours(6);
      const operation = genOperation(
        this.mock,
        0n,
        this.mock.interface.encodeFunctionData('updateDelay', [newDelay]),
        ethers.ZeroHash,
        '0xf8e775b2c5f4d66fb5c7fa800f35ef518c262b6014b3c0aee6ea21bff157f108',
      );

      await this.mock
        .connect(this.proposer)
        .schedule(operation.target, operation.value, operation.data, operation.predecessor, operation.salt, MINDELAY);

      await this.mock.getTimestamp(operation.id).then(time.increaseTo.timestamp);

      await expect(
        this.mock
          .connect(this.executor)
          .execute(operation.target, operation.value, operation.data, operation.predecessor, operation.salt),
      )
        .to.emit(this.mock, 'MinDelayChange')
        .withArgs(MINDELAY, newDelay);

      expect(await this.mock.getMinDelay()).to.equal(newDelay);
    });
  });

  describe('dependency', function () {
    beforeEach(async function () {
      this.operation1 = genOperation(
        '0xdE66bD4c97304200A95aE0AadA32d6d01A867E39',
        0n,
        '0x01dc731a',
        ethers.ZeroHash,
        '0x64e932133c7677402ead2926f86205e2ca4686aebecf5a8077627092b9bb2feb',
      );
      this.operation2 = genOperation(
        '0x3c7944a3F1ee7fc8c5A5134ba7c79D11c3A1FCa3',
        0n,
        '0x8f531849',
        this.operation1.id,
        '0x036e1311cac523f9548e6461e29fb1f8f9196b91910a41711ea22f5de48df07d',
      );
      await this.mock
        .connect(this.proposer)
        .schedule(
          this.operation1.target,
          this.operation1.value,
          this.operation1.data,
          this.operation1.predecessor,
          this.operation1.salt,
          MINDELAY,
        );
      await this.mock
        .connect(this.proposer)
        .schedule(
          this.operation2.target,
          this.operation2.value,
          this.operation2.data,
          this.operation2.predecessor,
          this.operation2.salt,
          MINDELAY,
        );

      await this.mock.getTimestamp(this.operation2.id).then(time.increaseTo.timestamp);
    });

    it('cannot execute before dependency', async function () {
      await expect(
        this.mock
          .connect(this.executor)
          .execute(
            this.operation2.target,
            this.operation2.value,
            this.operation2.data,
            this.operation2.predecessor,
            this.operation2.salt,
          ),
      )
        .to.be.revertedWithCustomError(this.mock, 'TimelockUnexecutedPredecessor')
        .withArgs(this.operation1.id);
    });

    it('can execute after dependency', async function () {
      await this.mock
        .connect(this.executor)
        .execute(
          this.operation1.target,
          this.operation1.value,
          this.operation1.data,
          this.operation1.predecessor,
          this.operation1.salt,
        );
      await this.mock
        .connect(this.executor)
        .execute(
          this.operation2.target,
          this.operation2.value,
          this.operation2.data,
          this.operation2.predecessor,
          this.operation2.salt,
        );
    });
  });

  describe('usage scenario', function () {
    this.timeout(10000);

    it('call', async function () {
      const operation = genOperation(
        this.implementation2,
        0n,
        this.implementation2.interface.encodeFunctionData('setValue', [42n]),
        ethers.ZeroHash,
        '0x8043596363daefc89977b25f9d9b4d06c3910959ef0c4d213557a903e1b555e2',
      );

      await this.mock
        .connect(this.proposer)
        .schedule(operation.target, operation.value, operation.data, operation.predecessor, operation.salt, MINDELAY);

      await this.mock.getTimestamp(operation.id).then(time.increaseTo.timestamp);

      await this.mock
        .connect(this.executor)
        .execute(operation.target, operation.value, operation.data, operation.predecessor, operation.salt);

      expect(await this.implementation2.getValue()).to.equal(42n);
    });

    it('call reverting', async function () {
      const operation = genOperation(
        this.callreceivermock,
        0n,
        this.callreceivermock.interface.encodeFunctionData('mockFunctionRevertsNoReason'),
        ethers.ZeroHash,
        '0xb1b1b276fdf1a28d1e00537ea73b04d56639128b08063c1a2f70a52e38cba693',
      );

      await this.mock
        .connect(this.proposer)
        .schedule(operation.target, operation.value, operation.data, operation.predecessor, operation.salt, MINDELAY);

      await this.mock.getTimestamp(operation.id).then(time.increaseTo.timestamp);

      await expect(
        this.mock
          .connect(this.executor)
          .execute(operation.target, operation.value, operation.data, operation.predecessor, operation.salt),
      ).to.be.revertedWithCustomError(this.mock, 'FailedInnerCall');
    });

    it('call throw', async function () {
      const operation = genOperation(
        this.callreceivermock,
        0n,
        this.callreceivermock.interface.encodeFunctionData('mockFunctionThrows'),
        ethers.ZeroHash,
        '0xe5ca79f295fc8327ee8a765fe19afb58f4a0cbc5053642bfdd7e73bc68e0fc67',
      );

      await this.mock
        .connect(this.proposer)
        .schedule(operation.target, operation.value, operation.data, operation.predecessor, operation.salt, MINDELAY);

      await this.mock.getTimestamp(operation.id).then(time.increaseTo.timestamp);

      // Targeted function reverts with a panic code (0x1) + the timelock bubble the panic code
      await expect(
        this.mock
          .connect(this.executor)
          .execute(operation.target, operation.value, operation.data, operation.predecessor, operation.salt),
      ).to.be.revertedWithPanic(PANIC_CODES.ASSERTION_ERROR);
    });

    it('call out of gas', async function () {
      const operation = genOperation(
        this.callreceivermock,
        0n,
        this.callreceivermock.interface.encodeFunctionData('mockFunctionOutOfGas'),
        ethers.ZeroHash,
        '0xf3274ce7c394c5b629d5215723563a744b817e1730cca5587c567099a14578fd',
      );

      await this.mock
        .connect(this.proposer)
        .schedule(operation.target, operation.value, operation.data, operation.predecessor, operation.salt, MINDELAY);

      await this.mock.getTimestamp(operation.id).then(time.increaseTo.timestamp);

      await expect(
        this.mock
          .connect(this.executor)
          .execute(operation.target, operation.value, operation.data, operation.predecessor, operation.salt, {
            gasLimit: '100000',
          }),
      ).to.be.revertedWithCustomError(this.mock, 'FailedInnerCall');
    });

    it('call payable with eth', async function () {
      const operation = genOperation(
        this.callreceivermock,
        1,
        this.callreceivermock.interface.encodeFunctionData('mockFunction'),
        ethers.ZeroHash,
        '0x5ab73cd33477dcd36c1e05e28362719d0ed59a7b9ff14939de63a43073dc1f44',
      );

      await this.mock
        .connect(this.proposer)
        .schedule(operation.target, operation.value, operation.data, operation.predecessor, operation.salt, MINDELAY);

      await this.mock.getTimestamp(operation.id).then(time.increaseTo.timestamp);

      expect(await ethers.provider.getBalance(this.mock)).to.equal(0n);
      expect(await ethers.provider.getBalance(this.callreceivermock)).to.equal(0n);

      await this.mock
        .connect(this.executor)
        .execute(operation.target, operation.value, operation.data, operation.predecessor, operation.salt, {
          value: 1,
        });

      expect(await ethers.provider.getBalance(this.mock)).to.equal(0n);
      expect(await ethers.provider.getBalance(this.callreceivermock)).to.equal(1n);
    });

    it('call nonpayable with eth', async function () {
      const operation = genOperation(
        this.callreceivermock,
        1,
        this.callreceivermock.interface.encodeFunctionData('mockFunctionNonPayable'),
        ethers.ZeroHash,
        '0xb78edbd920c7867f187e5aa6294ae5a656cfbf0dea1ccdca3751b740d0f2bdf8',
      );

      await this.mock
        .connect(this.proposer)
        .schedule(operation.target, operation.value, operation.data, operation.predecessor, operation.salt, MINDELAY);

      await this.mock.getTimestamp(operation.id).then(time.increaseTo.timestamp);

      expect(await ethers.provider.getBalance(this.mock)).to.equal(0n);
      expect(await ethers.provider.getBalance(this.callreceivermock)).to.equal(0n);

      await expect(
        this.mock
          .connect(this.executor)
          .execute(operation.target, operation.value, operation.data, operation.predecessor, operation.salt),
      ).to.be.revertedWithCustomError(this.mock, 'FailedInnerCall');

      expect(await ethers.provider.getBalance(this.mock)).to.equal(0n);
      expect(await ethers.provider.getBalance(this.callreceivermock)).to.equal(0n);
    });

    it('call reverting with eth', async function () {
      const operation = genOperation(
        this.callreceivermock,
        1,
        this.callreceivermock.interface.encodeFunctionData('mockFunctionRevertsNoReason'),
        ethers.ZeroHash,
        '0xdedb4563ef0095db01d81d3f2decf57cf83e4a72aa792af14c43a792b56f4de6',
      );

      await this.mock
        .connect(this.proposer)
        .schedule(operation.target, operation.value, operation.data, operation.predecessor, operation.salt, MINDELAY);

      await this.mock.getTimestamp(operation.id).then(time.increaseTo.timestamp);

      expect(await ethers.provider.getBalance(this.mock)).to.equal(0n);
      expect(await ethers.provider.getBalance(this.callreceivermock)).to.equal(0n);

      await expect(
        this.mock
          .connect(this.executor)
          .execute(operation.target, operation.value, operation.data, operation.predecessor, operation.salt),
      ).to.be.revertedWithCustomError(this.mock, 'FailedInnerCall');

      expect(await ethers.provider.getBalance(this.mock)).to.equal(0n);
      expect(await ethers.provider.getBalance(this.callreceivermock)).to.equal(0n);
    });
  });

  describe('safe receive', function () {
    describe('ERC721', function () {
      const tokenId = 1n;

      beforeEach(async function () {
        this.token = await ethers.deployContract('$ERC721', ['Non Fungible Token', 'NFT']);
        await this.token.$_mint(this.other, tokenId);
      });

      it('can receive an ERC721 safeTransfer', async function () {
        await this.token.connect(this.other).safeTransferFrom(this.other, this.mock, tokenId);
      });
    });

    describe('ERC1155', function () {
      const tokenIds = {
        1: 1000n,
        2: 2000n,
        3: 3000n,
      };

      beforeEach(async function () {
        this.token = await ethers.deployContract('$ERC1155', ['https://token-cdn-domain/{id}.json']);
        await this.token.$_mintBatch(this.other, Object.keys(tokenIds), Object.values(tokenIds), '0x');
      });

      it('can receive ERC1155 safeTransfer', async function () {
        await this.token.connect(this.other).safeTransferFrom(
          this.other,
          this.mock,
          ...Object.entries(tokenIds)[0n], // id + amount
          '0x',
        );
      });

      it('can receive ERC1155 safeBatchTransfer', async function () {
        await this.token
          .connect(this.other)
          .safeBatchTransferFrom(this.other, this.mock, Object.keys(tokenIds), Object.values(tokenIds), '0x');
      });
    });
  });
});
