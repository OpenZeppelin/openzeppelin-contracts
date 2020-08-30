const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const Timelock = contract.fromArtifact('TimelockMock');
const CallReceiverMock = contract.fromArtifact('CallReceiverMock');
const Implementation2 = contract.fromArtifact('Implementation2');
const MINDELAY = time.duration.days(1);

function genCommitment (target, value, data, salt) {
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

function genCommitmentBatch (targets, values, datas, salt) {
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

describe('Timelock', function () {
  const [ admin, proposer, executer, other ] = accounts;

  beforeEach(async function () {
    // Deploy new timelock
    this.timelock = await Timelock.new(MINDELAY, { from: admin });
    // Grand proposer & executer role
    await this.timelock.grantRole(await this.timelock.PROPOSER_ROLE(), proposer, { from: admin });
    await this.timelock.grantRole(await this.timelock.EXECUTER_ROLE(), executer, { from: admin });
    // Transfer administration to timelock
    await this.timelock.makeLive({ from: admin });
    // Mocks
    this.callreceivermock = await CallReceiverMock.new({ from: admin });
    this.implementation2 = await Implementation2.new({ from: admin });
  });

  it('initial state', async function () {
    expect(await this.timelock.viewMinDelay()).to.be.bignumber.equal(MINDELAY);
  });

  describe('methods', function () {
    describe('commit', function () {
      beforeEach(async function () {
        this.commitment = genCommitment(
          ZERO_ADDRESS,
          0,
          web3.utils.randomHex(4),
          web3.utils.randomHex(32),
        );
      });

      it('proposer can commit', async function () {
        const receipt = await this.timelock.commit(this.commitment.id, MINDELAY, { from: proposer });
        expectEvent(receipt, 'Commitment', { id: this.commitment.id });
      });

      it('commitment is registered', async function () {
        const receipt = await this.timelock.commit(this.commitment.id, MINDELAY, { from: proposer });
        expectEvent(receipt, 'Commitment', { id: this.commitment.id });

        const block = await web3.eth.getBlock(receipt.receipt.blockHash);

        expect(await this.timelock.viewCommitment(this.commitment.id))
          .to.be.bignumber.equal(web3.utils.toBN(block.timestamp).add(MINDELAY));
      });

      it('prevent overwritting active commitments', async function () {
        const receipt = await this.timelock.commit(this.commitment.id, MINDELAY, { from: proposer });
        expectEvent(receipt, 'Commitment', { id: this.commitment.id });

        await expectRevert(
          this.timelock.commit(this.commitment.id, MINDELAY, { from: proposer }),
          'Timelock: commitment already exists'
        );
      });

      it('prevent non-proposer from commiting', async function () {
        await expectRevert(
          this.timelock.commit(this.commitment.id, MINDELAY, { from: other }),
          'Timelock: sender requiers permission'
        );
      });
    });

    describe('reveal', function () {
      beforeEach(async function () {
        this.commitment = genCommitment(
          ZERO_ADDRESS,
          0,
          web3.utils.randomHex(4),
          web3.utils.randomHex(32),
        );
      });

      describe('no commitment', function () {
        it('reverts', async function () {
          await expectRevert(
            this.timelock.reveal(
              this.commitment.target,
              this.commitment.value,
              this.commitment.data,
              this.commitment.salt,
              { from: executer }
            ),
            'Timelock: no matching commitment'
          );
        });
      });

      describe('with commitment', function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.timelock.commit(this.commitment.id, MINDELAY, { from: proposer }));
        });

        describe('to early', function () {
          it('reverts', async function () {
            await expectRevert(
              this.timelock.reveal(
                this.commitment.target,
                this.commitment.value,
                this.commitment.data,
                this.commitment.salt,
                { from: executer }
              ),
              'Timelock: too early to execute'
            );
          });
        });

        describe('almost but not quite', function () {
          beforeEach(async function () {
            const timestamp = await this.timelock.viewCommitment(this.commitment.id);
            await time.increaseTo(timestamp - 2); // -1 is to tight, test sometime fails
          });

          it('reverts', async function () {
            await expectRevert(
              this.timelock.reveal(
                this.commitment.target,
                this.commitment.value,
                this.commitment.data,
                this.commitment.salt,
                { from: executer }
              ),
              'Timelock: too early to execute'
            );
          });
        });

        describe('on time', function () {
          beforeEach(async function () {
            const timestamp = await this.timelock.viewCommitment(this.commitment.id);
            await time.increaseTo(timestamp);
          });

          it('executer can reveal', async function () {
            const receipt = await this.timelock.reveal(
              this.commitment.target,
              this.commitment.value,
              this.commitment.data,
              this.commitment.salt,
              { from: executer }
            );
            expectEvent(receipt, 'Executed', {
              id: this.commitment.id,
              index: web3.utils.toBN(0),
              target: this.commitment.target,
              value: web3.utils.toBN(this.commitment.value),
              data: this.commitment.data,
            });
          });

          it('commitment is cleared', async function () {
            const receipt = await this.timelock.reveal(
              this.commitment.target,
              this.commitment.value,
              this.commitment.data,
              this.commitment.salt,
              { from: executer }
            );
            expectEvent(receipt, 'Executed', {
              id: this.commitment.id,
              index: web3.utils.toBN(0),
              target: this.commitment.target,
              value: web3.utils.toBN(this.commitment.value),
              data: this.commitment.data,
            });

            expect(await this.timelock.viewCommitment(this.commitment.id)).to.be.bignumber.equal(web3.utils.toBN(0));
          });

          it('prevent non-executer from revealing', async function () {
            await expectRevert(
              this.timelock.reveal(
                this.commitment.target,
                this.commitment.value,
                this.commitment.data,
                this.commitment.salt,
                { from: other }
              ),
              'Timelock: sender requiers permission'
            );
          });
        });
      });
    });

    describe('revealBatch', function () {
      beforeEach(async function () {
        this.commitment = genCommitmentBatch(
          Array(8).fill().map(() => ZERO_ADDRESS),
          Array(8).fill().map(() => 0),
          Array(8).fill().map(() => web3.utils.randomHex(4)),
          web3.utils.randomHex(32),
        );
      });

      describe('no commitment', function () {
        it('reverts', async function () {
          await expectRevert(
            this.timelock.revealBatch(
              this.commitment.targets,
              this.commitment.values,
              this.commitment.datas,
              this.commitment.salt,
              { from: executer }
            ),
            'Timelock: no matching commitment'
          );
        });
      });

      describe('with commitment', function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.timelock.commit(this.commitment.id, MINDELAY, { from: proposer }));
        });

        describe('to early', function () {
          it('reverts', async function () {
            await expectRevert(
              this.timelock.revealBatch(
                this.commitment.targets,
                this.commitment.values,
                this.commitment.datas,
                this.commitment.salt,
                { from: executer }
              ),
              'Timelock: too early to execute'
            );
          });
        });

        describe('almost but not quite', function () {
          beforeEach(async function () {
            const timestamp = await this.timelock.viewCommitment(this.commitment.id);
            await time.increaseTo(timestamp - 2); // -1 is to tight, test sometime fails
          });

          it('reverts', async function () {
            await expectRevert(
              this.timelock.revealBatch(
                this.commitment.targets,
                this.commitment.values,
                this.commitment.datas,
                this.commitment.salt,
                { from: executer }
              ),
              'Timelock: too early to execute'
            );
          });
        });

        describe('on time', function () {
          beforeEach(async function () {
            const timestamp = await this.timelock.viewCommitment(this.commitment.id);
            await time.increaseTo(timestamp);
          });

          it('executer can reveal', async function () {
            const receipt = await this.timelock.revealBatch(
              this.commitment.targets,
              this.commitment.values,
              this.commitment.datas,
              this.commitment.salt,
              { from: executer }
            );
            for (const i in this.commitment.targets) {
              expectEvent(receipt, 'Executed', {
                id: this.commitment.id,
                index: web3.utils.toBN(i),
                target: this.commitment.targets[i],
                value: web3.utils.toBN(this.commitment.values[i]),
                data: this.commitment.datas[i],
              });
            }
          });

          it('commitment is cleared', async function () {
            const receipt = await this.timelock.revealBatch(
              this.commitment.targets,
              this.commitment.values,
              this.commitment.datas,
              this.commitment.salt,
              { from: executer }
            );
            for (const i in this.commitment.targets) {
              expectEvent(receipt, 'Executed', {
                id: this.commitment.id,
                index: web3.utils.toBN(i),
                target: this.commitment.targets[i],
                value: web3.utils.toBN(this.commitment.values[i]),
                data: this.commitment.datas[i],
              });
            }

            expect(await this.timelock.viewCommitment(this.commitment.id)).to.be.bignumber.equal(web3.utils.toBN(0));
          });

          it('prevent non-executer from revealing', async function () {
            await expectRevert(
              this.timelock.revealBatch(
                this.commitment.targets,
                this.commitment.values,
                this.commitment.datas,
                this.commitment.salt,
                { from: other }
              ),
              'Timelock: sender requiers permission'
            );
          });

          it('length missmatch #1', async function () {
            await expectRevert(
              this.timelock.revealBatch(
                [],
                this.commitment.values,
                this.commitment.datas,
                this.commitment.salt,
                { from: executer }
              ),
              'Timelock: length missmatch'
            );
          });

          it('length missmatch #2', async function () {
            await expectRevert(
              this.timelock.revealBatch(
                this.commitment.targets,
                [],
                this.commitment.datas,
                this.commitment.salt,
                { from: executer }
              ),
              'Timelock: length missmatch'
            );
          });

          it('length missmatch #3', async function () {
            await expectRevert(
              this.timelock.revealBatch(
                this.commitment.targets,
                this.commitment.values,
                [],
                this.commitment.salt,
                { from: executer }
              ),
              'Timelock: length missmatch'
            );
          });
        });
      });

      it('partial execution', async function () {
        const commitment = genCommitmentBatch(
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

        await this.timelock.commit(commitment.id, MINDELAY, { from: proposer });
        await time.increase(MINDELAY);
        await expectRevert(
          this.timelock.revealBatch(
            commitment.targets,
            commitment.values,
            commitment.datas,
            commitment.salt,
            { from: executer }
          ),
          'Timelock: underlying transaction reverted'
        );
      });
    });

    describe('cancel', function () {
      beforeEach(async function () {
        this.commitment = genCommitment(
          ZERO_ADDRESS,
          0,
          web3.utils.randomHex(4),
          web3.utils.randomHex(32),
        );
        ({ logs: this.logs } = await this.timelock.commit(this.commitment.id, MINDELAY, { from: proposer }));
      });

      it('proposer can cancel', async function () {
        const receipt = await this.timelock.cancel(this.commitment.id, { from: proposer });
        expectEvent(receipt, 'Canceled', { id: this.commitment.id });
      });

      it('commitment is cleared', async function () {
        const receipt = await this.timelock.cancel(this.commitment.id, { from: proposer });
        expectEvent(receipt, 'Canceled', { id: this.commitment.id });

        expect(await this.timelock.viewCommitment(this.commitment.id)).to.be.bignumber.equal(web3.utils.toBN(0));
      });

      it('prevent non-proposer from canceling', async function () {
        await expectRevert(
          this.timelock.cancel(this.commitment.id, { from: other }),
          'Timelock: sender requiers permission'
        );
      });
    });
  });

  describe('maintenance', function () {
    it('prevent unauthorized maintenance', async function () {
      await expectRevert(
        this.timelock.updateDelay(0, { from: other }),
        'Timelock: sender requiers permission'
      );
    });

    it('timelock scheduled maintenance', async function () {
      const randomBN = web3.utils.randomHex(16);
      const commitment = genCommitment(
        this.timelock.address,
        0,
        this.timelock.contract.methods.updateDelay(randomBN).encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.timelock.commit(commitment.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);
      const receipt = await this.timelock.reveal(
        commitment.target,
        commitment.value,
        commitment.data,
        commitment.salt,
        { from: executer }
      );
      expectEvent(receipt, 'Executed', {});
      expectEvent(receipt, 'MinDelayChange', { newDuration: web3.utils.toBN(randomBN), oldDuration: MINDELAY });

      expect(await this.timelock.viewMinDelay()).to.be.bignumber.equal(web3.utils.toBN(randomBN));
    });
  });

  describe('scenari', function () {
    it('call', async function () {
      const randomBN = web3.utils.randomHex(16);
      const commitment = genCommitment(
        this.implementation2.address,
        0,
        this.implementation2.contract.methods.setValue(randomBN).encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.timelock.commit(commitment.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);
      const receipt = await this.timelock.reveal(
        commitment.target,
        commitment.value,
        commitment.data,
        commitment.salt,
        { from: executer }
      );
      expectEvent(receipt, 'Executed');

      expect(await this.implementation2.getValue()).to.be.bignumber.equal(web3.utils.toBN(randomBN));
    });

    it('call reverting', async function () {
      const commitment = genCommitment(
        this.callreceivermock.address,
        0,
        this.callreceivermock.contract.methods.mockFunctionRevertsNoReason().encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.timelock.commit(commitment.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);
      await expectRevert(
        this.timelock.reveal(
          commitment.target,
          commitment.value,
          commitment.data,
          commitment.salt,
          { from: executer }
        ),
        'Timelock: underlying transaction reverted'
      );
    });

    it('call throw', async function () {
      const commitment = genCommitment(
        this.callreceivermock.address,
        0,
        this.callreceivermock.contract.methods.mockFunctionThrows().encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.timelock.commit(commitment.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);
      await expectRevert(
        this.timelock.reveal(
          commitment.target,
          commitment.value,
          commitment.data,
          commitment.salt,
          { from: executer }
        ),
        'Timelock: underlying transaction reverted'
      );
    });

    it('call out of gas', async function () {
      const commitment = genCommitment(
        this.callreceivermock.address,
        0,
        this.callreceivermock.contract.methods.mockFunctionOutOfGas().encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.timelock.commit(commitment.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);
      await expectRevert(
        this.timelock.reveal(
          commitment.target,
          commitment.value,
          commitment.data,
          commitment.salt,
          { from: executer }
        ),
        'Timelock: underlying transaction reverted'
      );
    });

    it('call payable with eth', async function () {
      const commitment = genCommitment(
        this.callreceivermock.address,
        1,
        this.callreceivermock.contract.methods.mockFunction().encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.timelock.commit(commitment.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      const receipt = await this.timelock.reveal(
        commitment.target,
        commitment.value,
        commitment.data,
        commitment.salt,
        { from: executer, value: 1 }
      );
      expectEvent(receipt, 'Executed', {});

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(1));
    });

    it('call nonpayable with eth', async function () {
      const commitment = genCommitment(
        this.callreceivermock.address,
        1,
        this.callreceivermock.contract.methods.mockFunctionNonPayable().encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.timelock.commit(commitment.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      await expectRevert(
        this.timelock.reveal(
          commitment.target,
          commitment.value,
          commitment.data,
          commitment.salt,
          { from: executer }
        ),
        'Timelock: underlying transaction reverted'
      );

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
    });

    it('call reverting with eth', async function () {
      const commitment = genCommitment(
        this.callreceivermock.address,
        1,
        this.callreceivermock.contract.methods.mockFunctionRevertsNoReason().encodeABI(),
        web3.utils.randomHex(32),
      );

      await this.timelock.commit(commitment.id, MINDELAY, { from: proposer });
      await time.increase(MINDELAY);

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));

      await expectRevert(
        this.timelock.reveal(
          commitment.target,
          commitment.value,
          commitment.data,
          commitment.salt,
          { from: executer }
        ),
        'Timelock: underlying transaction reverted'
      );

      expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
      expect(await web3.eth.getBalance(this.callreceivermock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
    });
  });
});
