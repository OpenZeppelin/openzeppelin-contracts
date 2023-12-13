const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Enums = require('../../helpers/enums');
const { GovernorHelper, proposalStatesToBitMap, timelockSalt } = require('../../helpers/governance');
const { expectRevertCustomError } = require('../../helpers/customError');
const { clockFromReceipt } = require('../../helpers/time');

const Timelock = artifacts.require('TimelockController');
const Governor = artifacts.require('$GovernorTimelockControlMock');
const CallReceiver = artifacts.require('CallReceiverMock');
const ERC721 = artifacts.require('$ERC721');
const ERC1155 = artifacts.require('$ERC1155');

const TOKENS = [
  { Token: artifacts.require('$ERC20Votes'), mode: 'blocknumber' },
  { Token: artifacts.require('$ERC20VotesTimestampMock'), mode: 'timestamp' },
];

contract('GovernorTimelockControl', function (accounts) {
  const [owner, voter1, voter2, voter3, voter4, other] = accounts;

  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const PROPOSER_ROLE = web3.utils.soliditySha3('PROPOSER_ROLE');
  const EXECUTOR_ROLE = web3.utils.soliditySha3('EXECUTOR_ROLE');
  const CANCELLER_ROLE = web3.utils.soliditySha3('CANCELLER_ROLE');

  const name = 'OZ-Governor';
  const version = '1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');
  const votingDelay = web3.utils.toBN(4);
  const votingPeriod = web3.utils.toBN(16);
  const value = web3.utils.toWei('1');

  const delay = 3600;

  for (const { mode, Token } of TOKENS) {
    describe(`using ${Token._json.contractName}`, function () {
      beforeEach(async function () {
        const [deployer] = await web3.eth.getAccounts();

        this.token = await Token.new(tokenName, tokenSymbol, tokenName, version);
        this.timelock = await Timelock.new(delay, [], [], deployer);
        this.mock = await Governor.new(
          name,
          votingDelay,
          votingPeriod,
          0,
          this.timelock.address,
          this.token.address,
          0,
        );
        this.receiver = await CallReceiver.new();

        this.helper = new GovernorHelper(this.mock, mode);

        this.PROPOSER_ROLE = await this.timelock.PROPOSER_ROLE();
        this.EXECUTOR_ROLE = await this.timelock.EXECUTOR_ROLE();
        this.CANCELLER_ROLE = await this.timelock.CANCELLER_ROLE();

        await web3.eth.sendTransaction({ from: owner, to: this.timelock.address, value });

        // normal setup: governor is proposer, everyone is executor, timelock is its own admin
        await this.timelock.grantRole(PROPOSER_ROLE, this.mock.address);
        await this.timelock.grantRole(PROPOSER_ROLE, owner);
        await this.timelock.grantRole(CANCELLER_ROLE, this.mock.address);
        await this.timelock.grantRole(CANCELLER_ROLE, owner);
        await this.timelock.grantRole(EXECUTOR_ROLE, constants.ZERO_ADDRESS);
        await this.timelock.revokeRole(DEFAULT_ADMIN_ROLE, deployer);

        await this.token.$_mint(owner, tokenSupply);
        await this.helper.delegate({ token: this.token, to: voter1, value: web3.utils.toWei('10') }, { from: owner });
        await this.helper.delegate({ token: this.token, to: voter2, value: web3.utils.toWei('7') }, { from: owner });
        await this.helper.delegate({ token: this.token, to: voter3, value: web3.utils.toWei('5') }, { from: owner });
        await this.helper.delegate({ token: this.token, to: voter4, value: web3.utils.toWei('2') }, { from: owner });

        // default proposal
        this.proposal = this.helper.setProposal(
          [
            {
              target: this.receiver.address,
              value,
              data: this.receiver.contract.methods.mockFunction().encodeABI(),
            },
          ],
          '<proposal description>',
        );

        this.proposal.timelockid = await this.timelock.hashOperationBatch(
          ...this.proposal.shortProposal.slice(0, 3),
          '0x0',
          timelockSalt(this.mock.address, this.proposal.shortProposal[3]),
        );
      });

      it("doesn't accept ether transfers", async function () {
        await expectRevert.unspecified(web3.eth.sendTransaction({ from: owner, to: this.mock.address, value: 1 }));
      });

      it('post deployment check', async function () {
        expect(await this.mock.name()).to.be.equal(name);
        expect(await this.mock.token()).to.be.equal(this.token.address);
        expect(await this.mock.votingDelay()).to.be.bignumber.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.be.bignumber.equal(votingPeriod);
        expect(await this.mock.quorum(0)).to.be.bignumber.equal('0');

        expect(await this.mock.timelock()).to.be.equal(this.timelock.address);
      });

      it('nominal', async function () {
        expect(await this.mock.proposalEta(this.proposal.id)).to.be.bignumber.equal('0');
        expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.equal(true);

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter2 });
        await this.helper.vote({ support: Enums.VoteType.Against }, { from: voter3 });
        await this.helper.vote({ support: Enums.VoteType.Abstain }, { from: voter4 });
        await this.helper.waitForDeadline();
        const txQueue = await this.helper.queue();
        await this.helper.waitForEta();

        const eta = web3.utils.toBN(await clockFromReceipt.timestamp(txQueue.receipt)).addn(delay);
        expect(await this.mock.proposalEta(this.proposal.id)).to.be.bignumber.equal(eta);
        expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.equal(true);

        const txExecute = await this.helper.execute();

        expectEvent(txQueue, 'ProposalQueued', { proposalId: this.proposal.id });
        await expectEvent.inTransaction(txQueue.tx, this.timelock, 'CallScheduled', { id: this.proposal.timelockid });
        await expectEvent.inTransaction(txQueue.tx, this.timelock, 'CallSalt', {
          id: this.proposal.timelockid,
        });

        expectEvent(txExecute, 'ProposalExecuted', { proposalId: this.proposal.id });
        await expectEvent.inTransaction(txExecute.tx, this.timelock, 'CallExecuted', { id: this.proposal.timelockid });
        await expectEvent.inTransaction(txExecute.tx, this.receiver, 'MockFunctionCalled');
      });

      describe('should revert', function () {
        describe('on queue', function () {
          it('if already queued', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await expectRevertCustomError(this.helper.queue(), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Queued,
              proposalStatesToBitMap([Enums.ProposalState.Succeeded]),
            ]);
          });
        });

        describe('on execute', function () {
          it('if not queued', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline(+1);

            expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Succeeded);

            await expectRevertCustomError(this.helper.execute(), 'TimelockUnexpectedOperationState', [
              this.proposal.timelockid,
              proposalStatesToBitMap(Enums.OperationState.Ready),
            ]);
          });

          it('if too early', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.queue();

            expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Queued);

            await expectRevertCustomError(this.helper.execute(), 'TimelockUnexpectedOperationState', [
              this.proposal.timelockid,
              proposalStatesToBitMap(Enums.OperationState.Ready),
            ]);
          });

          it('if already executed', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await this.helper.waitForEta();
            await this.helper.execute();
            await expectRevertCustomError(this.helper.execute(), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Executed,
              proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
            ]);
          });

          it('if already executed by another proposer', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await this.helper.waitForEta();

            await this.timelock.executeBatch(
              ...this.proposal.shortProposal.slice(0, 3),
              '0x0',
              timelockSalt(this.mock.address, this.proposal.shortProposal[3]),
            );

            await expectRevertCustomError(this.helper.execute(), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Executed,
              proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
            ]);
          });
        });
      });

      describe('cancel', function () {
        it('cancel before queue prevents scheduling', async function () {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();

          expectEvent(await this.helper.cancel('internal'), 'ProposalCanceled', { proposalId: this.proposal.id });

          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);
          await expectRevertCustomError(this.helper.queue(), 'GovernorUnexpectedProposalState', [
            this.proposal.id,
            Enums.ProposalState.Canceled,
            proposalStatesToBitMap([Enums.ProposalState.Succeeded]),
          ]);
        });

        it('cancel after queue prevents executing', async function () {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();
          await this.helper.queue();

          expectEvent(await this.helper.cancel('internal'), 'ProposalCanceled', { proposalId: this.proposal.id });

          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);
          await expectRevertCustomError(this.helper.execute(), 'GovernorUnexpectedProposalState', [
            this.proposal.id,
            Enums.ProposalState.Canceled,
            proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
          ]);
        });

        it('cancel on timelock is reflected on governor', async function () {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();
          await this.helper.queue();

          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Queued);

          expectEvent(await this.timelock.cancel(this.proposal.timelockid, { from: owner }), 'Cancelled', {
            id: this.proposal.timelockid,
          });

          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);
        });
      });

      describe('onlyGovernance', function () {
        describe('relay', function () {
          beforeEach(async function () {
            await this.token.$_mint(this.mock.address, 1);
          });

          it('is protected', async function () {
            await expectRevertCustomError(
              this.mock.relay(this.token.address, 0, this.token.contract.methods.transfer(other, 1).encodeABI(), {
                from: owner,
              }),
              'GovernorOnlyExecutor',
              [owner],
            );
          });

          it('can be executed through governance', async function () {
            this.helper.setProposal(
              [
                {
                  target: this.mock.address,
                  data: this.mock.contract.methods
                    .relay(this.token.address, 0, this.token.contract.methods.transfer(other, 1).encodeABI())
                    .encodeABI(),
                },
              ],
              '<proposal description>',
            );

            expect(await this.token.balanceOf(this.mock.address), 1);
            expect(await this.token.balanceOf(other), 0);

            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await this.helper.waitForEta();
            const txExecute = await this.helper.execute();

            expect(await this.token.balanceOf(this.mock.address), 0);
            expect(await this.token.balanceOf(other), 1);

            await expectEvent.inTransaction(txExecute.tx, this.token, 'Transfer', {
              from: this.mock.address,
              to: other,
              value: '1',
            });
          });

          it('is payable and can transfer eth to EOA', async function () {
            const t2g = web3.utils.toBN(128); // timelock to governor
            const g2o = web3.utils.toBN(100); // governor to eoa (other)

            this.helper.setProposal(
              [
                {
                  target: this.mock.address,
                  value: t2g,
                  data: this.mock.contract.methods.relay(other, g2o, '0x').encodeABI(),
                },
              ],
              '<proposal description>',
            );

            expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
            const timelockBalance = await web3.eth.getBalance(this.timelock.address).then(web3.utils.toBN);
            const otherBalance = await web3.eth.getBalance(other).then(web3.utils.toBN);

            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await this.helper.waitForEta();
            await this.helper.execute();

            expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(timelockBalance.sub(t2g));
            expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal(t2g.sub(g2o));
            expect(await web3.eth.getBalance(other)).to.be.bignumber.equal(otherBalance.add(g2o));
          });

          it('protected against other proposers', async function () {
            const target = this.mock.address;
            const value = web3.utils.toWei('0');
            const data = this.mock.contract.methods.relay(constants.ZERO_ADDRESS, 0, '0x').encodeABI();
            const predecessor = constants.ZERO_BYTES32;
            const salt = constants.ZERO_BYTES32;

            await this.timelock.schedule(target, value, data, predecessor, salt, delay, { from: owner });

            await time.increase(delay);

            await expectRevertCustomError(
              this.timelock.execute(target, value, data, predecessor, salt, { from: owner }),
              'QueueEmpty', // Bubbled up from Governor
              [],
            );
          });
        });

        describe('updateTimelock', function () {
          beforeEach(async function () {
            this.newTimelock = await Timelock.new(
              delay,
              [this.mock.address],
              [this.mock.address],
              constants.ZERO_ADDRESS,
            );
          });

          it('is protected', async function () {
            await expectRevertCustomError(
              this.mock.updateTimelock(this.newTimelock.address, { from: owner }),
              'GovernorOnlyExecutor',
              [owner],
            );
          });

          it('can be executed through governance to', async function () {
            this.helper.setProposal(
              [
                {
                  target: this.mock.address,
                  data: this.mock.contract.methods.updateTimelock(this.newTimelock.address).encodeABI(),
                },
              ],
              '<proposal description>',
            );

            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await this.helper.waitForEta();
            const txExecute = await this.helper.execute();

            expectEvent(txExecute, 'TimelockChange', {
              oldTimelock: this.timelock.address,
              newTimelock: this.newTimelock.address,
            });

            expect(await this.mock.timelock()).to.be.bignumber.equal(this.newTimelock.address);
          });
        });

        describe('on safe receive', function () {
          describe('ERC721', function () {
            const name = 'Non Fungible Token';
            const symbol = 'NFT';
            const tokenId = web3.utils.toBN(1);

            beforeEach(async function () {
              this.token = await ERC721.new(name, symbol);
              await this.token.$_mint(owner, tokenId);
            });

            it("can't receive an ERC721 safeTransfer", async function () {
              await expectRevertCustomError(
                this.token.safeTransferFrom(owner, this.mock.address, tokenId, { from: owner }),
                'GovernorDisabledDeposit',
                [],
              );
            });
          });

          describe('ERC1155', function () {
            const uri = 'https://token-cdn-domain/{id}.json';
            const tokenIds = {
              1: web3.utils.toBN(1000),
              2: web3.utils.toBN(2000),
              3: web3.utils.toBN(3000),
            };

            beforeEach(async function () {
              this.token = await ERC1155.new(uri);
              await this.token.$_mintBatch(owner, Object.keys(tokenIds), Object.values(tokenIds), '0x');
            });

            it("can't receive ERC1155 safeTransfer", async function () {
              await expectRevertCustomError(
                this.token.safeTransferFrom(
                  owner,
                  this.mock.address,
                  ...Object.entries(tokenIds)[0], // id + amount
                  '0x',
                  { from: owner },
                ),
                'GovernorDisabledDeposit',
                [],
              );
            });

            it("can't receive ERC1155 safeBatchTransfer", async function () {
              await expectRevertCustomError(
                this.token.safeBatchTransferFrom(
                  owner,
                  this.mock.address,
                  Object.keys(tokenIds),
                  Object.values(tokenIds),
                  '0x',
                  { from: owner },
                ),
                'GovernorDisabledDeposit',
                [],
              );
            });
          });
        });
      });

      it('clear queue of pending governor calls', async function () {
        this.helper.setProposal(
          [
            {
              target: this.mock.address,
              data: this.mock.contract.methods.nonGovernanceFunction().encodeABI(),
            },
          ],
          '<proposal description>',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.waitForDeadline();
        await this.helper.queue();
        await this.helper.waitForEta();
        await this.helper.execute();

        // This path clears _governanceCall as part of the afterExecute call,
        // but we have not way to check that the cleanup actually happened other
        // then coverage reports.
      });
    });
  }
});
