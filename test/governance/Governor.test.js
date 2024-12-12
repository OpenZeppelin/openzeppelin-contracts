const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { GovernorHelper } = require('../helpers/governance');
const { getDomain, Ballot } = require('../helpers/eip712');
const { ProposalState, VoteType } = require('../helpers/enums');
const time = require('../helpers/time');

const { shouldSupportInterfaces } = require('../utils/introspection/SupportsInterface.behavior');
const { shouldBehaveLikeERC6372 } = require('./utils/ERC6372.behavior');

const TOKENS = [
  { Token: '$ERC20Votes', mode: 'blocknumber' },
  { Token: '$ERC20VotesTimestampMock', mode: 'timestamp' },
  { Token: '$ERC20VotesLegacyMock', mode: 'blocknumber' },
];

const name = 'OZ-Governor';
const version = '1';
const tokenName = 'MockToken';
const tokenSymbol = 'MTKN';
const tokenSupply = ethers.parseEther('100');
const votingDelay = 4n;
const votingPeriod = 16n;
const value = ethers.parseEther('1');

const signBallot = account => (contract, message) =>
  getDomain(contract).then(domain => account.signTypedData(domain, { Ballot }, message));

async function deployToken(contractName) {
  try {
    return await ethers.deployContract(contractName, [tokenName, tokenSymbol, tokenName, version]);
  } catch (error) {
    if (error.message == 'incorrect number of arguments to constructor') {
      // ERC20VotesLegacyMock has a different construction that uses version='1' by default.
      return ethers.deployContract(contractName, [tokenName, tokenSymbol, tokenName]);
    }
    throw error;
  }
}

describe('Governor', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [owner, proposer, voter1, voter2, voter3, voter4, userEOA] = await ethers.getSigners();
      const receiver = await ethers.deployContract('CallReceiverMock');

      const token = await deployToken(Token, [tokenName, tokenSymbol, version]);
      const mock = await ethers.deployContract('$GovernorMock', [
        name, // name
        votingDelay, // initialVotingDelay
        votingPeriod, // initialVotingPeriod
        0n, // initialProposalThreshold
        token, // tokenAddress
        10n, // quorumNumeratorValue
      ]);

      await owner.sendTransaction({ to: mock, value });
      await token.$_mint(owner, tokenSupply);

      const helper = new GovernorHelper(mock, mode);
      await helper.connect(owner).delegate({ token: token, to: voter1, value: ethers.parseEther('10') });
      await helper.connect(owner).delegate({ token: token, to: voter2, value: ethers.parseEther('7') });
      await helper.connect(owner).delegate({ token: token, to: voter3, value: ethers.parseEther('5') });
      await helper.connect(owner).delegate({ token: token, to: voter4, value: ethers.parseEther('2') });

      return {
        owner,
        proposer,
        voter1,
        voter2,
        voter3,
        voter4,
        userEOA,
        receiver,
        token,
        mock,
        helper,
      };
    };

    describe(`using ${Token}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
        // initiate fresh proposal
        this.proposal = this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
              value,
            },
          ],
          '<proposal description>',
        );
      });

      shouldSupportInterfaces(['ERC1155Receiver', 'Governor', 'Governor_5_3']);
      shouldBehaveLikeERC6372(mode);

      it('deployment check', async function () {
        expect(await this.mock.name()).to.equal(name);
        expect(await this.mock.token()).to.equal(this.token);
        expect(await this.mock.votingDelay()).to.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.equal(votingPeriod);
        expect(await this.mock.quorum(0)).to.equal(0n);
        expect(await this.mock.COUNTING_MODE()).to.equal('support=bravo&quorum=for,abstain');
      });

      it('nominal workflow', async function () {
        // Before
        expect(await this.mock.proposalProposer(this.proposal.id)).to.equal(ethers.ZeroAddress);
        expect(await this.mock.hasVoted(this.proposal.id, this.owner)).to.be.false;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter1)).to.be.false;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter2)).to.be.false;
        expect(await ethers.provider.getBalance(this.mock)).to.equal(value);
        expect(await ethers.provider.getBalance(this.receiver)).to.equal(0n);

        expect(await this.mock.proposalEta(this.proposal.id)).to.equal(0n);
        expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.false;

        // Run proposal
        const txPropose = await this.helper.connect(this.proposer).propose();
        const timepoint = await time.clockFromReceipt[mode](txPropose);

        await expect(txPropose)
          .to.emit(this.mock, 'ProposalCreated')
          .withArgs(
            this.proposal.id,
            this.proposer,
            this.proposal.targets,
            this.proposal.values,
            this.proposal.signatures,
            this.proposal.data,
            timepoint + votingDelay,
            timepoint + votingDelay + votingPeriod,
            this.proposal.description,
          );

        await this.helper.waitForSnapshot();

        await expect(this.helper.connect(this.voter1).vote({ support: VoteType.For, reason: 'This is nice' }))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter1, this.proposal.id, VoteType.For, ethers.parseEther('10'), 'This is nice');

        await expect(this.helper.connect(this.voter2).vote({ support: VoteType.For }))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter2, this.proposal.id, VoteType.For, ethers.parseEther('7'), '');

        await expect(this.helper.connect(this.voter3).vote({ support: VoteType.Against }))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter3, this.proposal.id, VoteType.Against, ethers.parseEther('5'), '');

        await expect(this.helper.connect(this.voter4).vote({ support: VoteType.Abstain }))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter4, this.proposal.id, VoteType.Abstain, ethers.parseEther('2'), '');

        await this.helper.waitForDeadline();

        const txExecute = await this.helper.execute();

        await expect(txExecute).to.emit(this.mock, 'ProposalExecuted').withArgs(this.proposal.id);

        await expect(txExecute).to.emit(this.receiver, 'MockFunctionCalled');

        // After
        expect(await this.mock.proposalProposer(this.proposal.id)).to.equal(this.proposer);
        expect(await this.mock.hasVoted(this.proposal.id, this.owner)).to.be.false;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter1)).to.be.true;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter2)).to.be.true;
        expect(await ethers.provider.getBalance(this.mock)).to.equal(0n);
        expect(await ethers.provider.getBalance(this.receiver)).to.equal(value);

        expect(await this.mock.proposalEta(this.proposal.id)).to.equal(0n);
        expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.false;
      });

      it('send ethers', async function () {
        this.helper.setProposal(
          [
            {
              target: this.userEOA.address,
              value,
            },
          ],
          '<proposal description>',
        );

        // Run proposal
        await expect(async () => {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: VoteType.For });
          await this.helper.waitForDeadline();
          return this.helper.execute();
        }).to.changeEtherBalances([this.mock, this.userEOA], [-value, value]);
      });

      describe('vote with signature', function () {
        it('votes with an EOA signature', async function () {
          await this.token.connect(this.voter1).delegate(this.userEOA);

          const nonce = await this.mock.nonces(this.userEOA);

          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await expect(
            this.helper.vote({
              support: VoteType.For,
              voter: this.userEOA.address,
              nonce,
              signature: signBallot(this.userEOA),
            }),
          )
            .to.emit(this.mock, 'VoteCast')
            .withArgs(this.userEOA, this.proposal.id, VoteType.For, ethers.parseEther('10'), '');

          await this.helper.waitForDeadline();
          await this.helper.execute();

          // After
          expect(await this.mock.hasVoted(this.proposal.id, this.userEOA)).to.be.true;
          expect(await this.mock.nonces(this.userEOA)).to.equal(nonce + 1n);
        });

        it('votes with a valid EIP-1271 signature', async function () {
          const wallet = await ethers.deployContract('ERC1271WalletMock', [this.userEOA]);

          await this.token.connect(this.voter1).delegate(wallet);

          const nonce = await this.mock.nonces(this.userEOA);

          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await expect(
            this.helper.vote({
              support: VoteType.For,
              voter: wallet.target,
              nonce,
              signature: signBallot(this.userEOA),
            }),
          )
            .to.emit(this.mock, 'VoteCast')
            .withArgs(wallet, this.proposal.id, VoteType.For, ethers.parseEther('10'), '');
          await this.helper.waitForDeadline();
          await this.helper.execute();

          // After
          expect(await this.mock.hasVoted(this.proposal.id, wallet)).to.be.true;
          expect(await this.mock.nonces(wallet)).to.equal(nonce + 1n);
        });

        afterEach('no other votes are cast', async function () {
          expect(await this.mock.hasVoted(this.proposal.id, this.owner)).to.be.false;
          expect(await this.mock.hasVoted(this.proposal.id, this.voter1)).to.be.false;
          expect(await this.mock.hasVoted(this.proposal.id, this.voter2)).to.be.false;
        });
      });

      describe('should revert', function () {
        describe('on propose', function () {
          it('if proposal already exists', async function () {
            await this.helper.propose();
            await expect(this.helper.propose())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(this.proposal.id, ProposalState.Pending, ethers.ZeroHash);
          });

          it('if proposer has below threshold votes', async function () {
            const votes = ethers.parseEther('10');
            const threshold = ethers.parseEther('1000');
            await this.mock.$_setProposalThreshold(threshold);
            await expect(this.helper.connect(this.voter1).propose())
              .to.be.revertedWithCustomError(this.mock, 'GovernorInsufficientProposerVotes')
              .withArgs(this.voter1, votes, threshold);
          });
        });

        describe('on vote', function () {
          it('if proposal does not exist', async function () {
            await expect(this.helper.connect(this.voter1).vote({ support: VoteType.For }))
              .to.be.revertedWithCustomError(this.mock, 'GovernorNonexistentProposal')
              .withArgs(this.proposal.id);
          });

          it('if voting has not started', async function () {
            await this.helper.propose();
            await expect(this.helper.connect(this.voter1).vote({ support: VoteType.For }))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Pending,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Active]),
              );
          });

          it('if support value is invalid', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await expect(this.helper.vote({ support: 255 })).to.be.revertedWithCustomError(
              this.mock,
              'GovernorInvalidVoteType',
            );
          });

          it('if vote was already casted', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await expect(this.helper.connect(this.voter1).vote({ support: VoteType.For }))
              .to.be.revertedWithCustomError(this.mock, 'GovernorAlreadyCastVote')
              .withArgs(this.voter1);
          });

          it('if voting is over', async function () {
            await this.helper.propose();
            await this.helper.waitForDeadline();
            await expect(this.helper.connect(this.voter1).vote({ support: VoteType.For }))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Defeated,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Active]),
              );
          });
        });

        describe('on vote by signature', function () {
          beforeEach(async function () {
            await this.token.connect(this.voter1).delegate(this.userEOA);

            // Run proposal
            await this.helper.propose();
            await this.helper.waitForSnapshot();
          });

          it('if signature does not match signer', async function () {
            const nonce = await this.mock.nonces(this.userEOA);

            function tamper(str, index, mask) {
              const arrayStr = ethers.getBytes(str);
              arrayStr[index] ^= mask;
              return ethers.hexlify(arrayStr);
            }

            const voteParams = {
              support: VoteType.For,
              voter: this.userEOA.address,
              nonce,
              signature: (...args) => signBallot(this.userEOA)(...args).then(sig => tamper(sig, 42, 0xff)),
            };

            await expect(this.helper.vote(voteParams))
              .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidSignature')
              .withArgs(voteParams.voter);
          });

          it('if vote nonce is incorrect', async function () {
            const nonce = await this.mock.nonces(this.userEOA);

            const voteParams = {
              support: VoteType.For,
              voter: this.userEOA.address,
              nonce: nonce + 1n,
              signature: signBallot(this.userEOA),
            };

            await expect(this.helper.vote(voteParams))
              .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidSignature')
              .withArgs(voteParams.voter);
          });
        });

        describe('on queue', function () {
          it('always', async function () {
            await this.helper.connect(this.proposer).propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();
            await expect(this.helper.queue()).to.be.revertedWithCustomError(this.mock, 'GovernorQueueNotImplemented');
          });
        });

        describe('on execute', function () {
          it('if proposal does not exist', async function () {
            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorNonexistentProposal')
              .withArgs(this.proposal.id);
          });

          it('if quorum is not reached', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter3).vote({ support: VoteType.For });
            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Active,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Succeeded, ProposalState.Queued]),
              );
          });

          it('if score not reached', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.Against });
            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Active,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Succeeded, ProposalState.Queued]),
              );
          });

          it('if voting is not over', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Active,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Succeeded, ProposalState.Queued]),
              );
          });

          it('if receiver revert without reason', async function () {
            this.helper.setProposal(
              [
                {
                  target: this.receiver.target,
                  data: this.receiver.interface.encodeFunctionData('mockFunctionRevertsNoReason'),
                },
              ],
              '<proposal description>',
            );

            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();
            await expect(this.helper.execute()).to.be.revertedWithCustomError(this.mock, 'FailedCall');
          });

          it('if receiver revert with reason', async function () {
            this.helper.setProposal(
              [
                {
                  target: this.receiver.target,
                  data: this.receiver.interface.encodeFunctionData('mockFunctionRevertsReason'),
                },
              ],
              '<proposal description>',
            );

            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();
            await expect(this.helper.execute()).to.be.revertedWith('CallReceiverMock: reverting');
          });

          it('if proposal was already executed', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();
            await this.helper.execute();
            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Executed,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Succeeded, ProposalState.Queued]),
              );
          });
        });
      });

      describe('state', function () {
        it('Unset', async function () {
          await expect(this.mock.state(this.proposal.id))
            .to.be.revertedWithCustomError(this.mock, 'GovernorNonexistentProposal')
            .withArgs(this.proposal.id);
        });

        it('Pending & Active', async function () {
          await this.helper.propose();
          expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Pending);
          await this.helper.waitForSnapshot();
          expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Pending);
          await this.helper.waitForSnapshot(1n);
          expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Active);
        });

        it('Defeated', async function () {
          await this.helper.propose();
          await this.helper.waitForDeadline();
          expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Active);
          await this.helper.waitForDeadline(1n);
          expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Defeated);
        });

        it('Succeeded', async function () {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: VoteType.For });
          await this.helper.waitForDeadline();
          expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Active);
          await this.helper.waitForDeadline(1n);
          expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Succeeded);
        });

        it('Executed', async function () {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: VoteType.For });
          await this.helper.waitForDeadline();
          await this.helper.execute();
          expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Executed);
        });
      });

      describe('cancel', function () {
        describe('internal', function () {
          it('before proposal', async function () {
            await expect(this.helper.cancel('internal'))
              .to.be.revertedWithCustomError(this.mock, 'GovernorNonexistentProposal')
              .withArgs(this.proposal.id);
          });

          it('after proposal', async function () {
            await this.helper.propose();

            await this.helper.cancel('internal');
            expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Canceled);

            await this.helper.waitForSnapshot();
            await expect(this.helper.connect(this.voter1).vote({ support: VoteType.For }))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Canceled,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Active]),
              );
          });

          it('after vote', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });

            await this.helper.cancel('internal');
            expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Canceled);

            await this.helper.waitForDeadline();
            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Canceled,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Succeeded, ProposalState.Queued]),
              );
          });

          it('after deadline', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();

            await this.helper.cancel('internal');
            expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Canceled);

            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Canceled,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Succeeded, ProposalState.Queued]),
              );
          });

          it('after execution', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();
            await this.helper.execute();

            await expect(this.helper.cancel('internal'))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Executed,
                GovernorHelper.proposalStatesToBitMap(
                  [ProposalState.Canceled, ProposalState.Expired, ProposalState.Executed],
                  { inverted: true },
                ),
              );
          });
        });

        describe('public', function () {
          it('before proposal', async function () {
            await expect(this.helper.cancel('external'))
              .to.be.revertedWithCustomError(this.mock, 'GovernorNonexistentProposal')
              .withArgs(this.proposal.id);
          });

          it('after proposal', async function () {
            await this.helper.propose();

            await this.helper.cancel('external');
          });

          it('after proposal - restricted to proposer', async function () {
            await this.helper.connect(this.proposer).propose();

            await expect(this.helper.connect(this.owner).cancel('external'))
              .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyProposer')
              .withArgs(this.owner);
          });

          it('after vote started', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot(1n); // snapshot + 1 block

            await expect(this.helper.cancel('external'))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Active,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Pending]),
              );
          });

          it('after vote', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });

            await expect(this.helper.cancel('external'))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Active,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Pending]),
              );
          });

          it('after deadline', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();

            await expect(this.helper.cancel('external'))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Succeeded,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Pending]),
              );
          });

          it('after execution', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();
            await this.helper.execute();

            await expect(this.helper.cancel('external'))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Executed,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Pending]),
              );
          });
        });
      });

      describe('proposal length', function () {
        it('empty', async function () {
          this.helper.setProposal([], '<proposal description>');

          await expect(this.helper.propose())
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidProposalLength')
            .withArgs(0, 0, 0);
        });

        it('mismatch #1', async function () {
          this.helper.setProposal(
            {
              targets: [],
              values: [0n],
              data: [this.receiver.interface.encodeFunctionData('mockFunction')],
            },
            '<proposal description>',
          );
          await expect(this.helper.propose())
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidProposalLength')
            .withArgs(0, 1, 1);
        });

        it('mismatch #2', async function () {
          this.helper.setProposal(
            {
              targets: [this.receiver.target],
              values: [],
              data: [this.receiver.interface.encodeFunctionData('mockFunction')],
            },
            '<proposal description>',
          );
          await expect(this.helper.propose())
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidProposalLength')
            .withArgs(1, 1, 0);
        });

        it('mismatch #3', async function () {
          this.helper.setProposal(
            {
              targets: [this.receiver.target],
              values: [0n],
              data: [],
            },
            '<proposal description>',
          );
          await expect(this.helper.propose())
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidProposalLength')
            .withArgs(1, 0, 1);
        });
      });

      describe('frontrun protection using description suffix', function () {
        function shouldPropose() {
          it('proposer can propose', async function () {
            const txPropose = await this.helper.connect(this.proposer).propose();

            await expect(txPropose)
              .to.emit(this.mock, 'ProposalCreated')
              .withArgs(
                this.proposal.id,
                this.proposer,
                this.proposal.targets,
                this.proposal.values,
                this.proposal.signatures,
                this.proposal.data,
                (await time.clockFromReceipt[mode](txPropose)) + votingDelay,
                (await time.clockFromReceipt[mode](txPropose)) + votingDelay + votingPeriod,
                this.proposal.description,
              );
          });

          it('someone else can propose', async function () {
            const txPropose = await this.helper.connect(this.voter1).propose();

            await expect(txPropose)
              .to.emit(this.mock, 'ProposalCreated')
              .withArgs(
                this.proposal.id,
                this.voter1,
                this.proposal.targets,
                this.proposal.values,
                this.proposal.signatures,
                this.proposal.data,
                (await time.clockFromReceipt[mode](txPropose)) + votingDelay,
                (await time.clockFromReceipt[mode](txPropose)) + votingDelay + votingPeriod,
                this.proposal.description,
              );
          });
        }

        describe('without protection', function () {
          describe('without suffix', function () {
            shouldPropose();
          });

          describe('with different suffix', function () {
            beforeEach(function () {
              this.proposal = this.helper.setProposal(
                [
                  {
                    target: this.receiver.target,
                    data: this.receiver.interface.encodeFunctionData('mockFunction'),
                    value,
                  },
                ],
                `<proposal description>#wrong-suffix=${this.proposer}`,
              );
            });

            shouldPropose();
          });

          describe('with proposer suffix but bad address part', function () {
            beforeEach(function () {
              this.proposal = this.helper.setProposal(
                [
                  {
                    target: this.receiver.target,
                    data: this.receiver.interface.encodeFunctionData('mockFunction'),
                    value,
                  },
                ],
                `<proposal description>#proposer=0x3C44CdDdB6a900fa2b585dd299e03d12FA429XYZ`, // XYZ are not a valid hex char
              );
            });

            shouldPropose();
          });
        });

        describe('with protection via proposer suffix', function () {
          beforeEach(function () {
            this.proposal = this.helper.setProposal(
              [
                {
                  target: this.receiver.target,
                  data: this.receiver.interface.encodeFunctionData('mockFunction'),
                  value,
                },
              ],
              `<proposal description>#proposer=${this.proposer}`,
            );
          });

          shouldPropose();
        });
      });

      describe('onlyGovernance updates', function () {
        it('setVotingDelay is protected', async function () {
          await expect(this.mock.connect(this.owner).setVotingDelay(0n))
            .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyExecutor')
            .withArgs(this.owner);
        });

        it('setVotingPeriod is protected', async function () {
          await expect(this.mock.connect(this.owner).setVotingPeriod(32n))
            .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyExecutor')
            .withArgs(this.owner);
        });

        it('setProposalThreshold is protected', async function () {
          await expect(this.mock.connect(this.owner).setProposalThreshold(1_000_000_000_000_000_000n))
            .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyExecutor')
            .withArgs(this.owner);
        });

        it('can setVotingDelay through governance', async function () {
          this.helper.setProposal(
            [
              {
                target: this.mock.target,
                data: this.mock.interface.encodeFunctionData('setVotingDelay', [0n]),
              },
            ],
            '<proposal description>',
          );

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: VoteType.For });
          await this.helper.waitForDeadline();

          await expect(this.helper.execute()).to.emit(this.mock, 'VotingDelaySet').withArgs(4n, 0n);

          expect(await this.mock.votingDelay()).to.equal(0n);
        });

        it('can setVotingPeriod through governance', async function () {
          this.helper.setProposal(
            [
              {
                target: this.mock.target,
                data: this.mock.interface.encodeFunctionData('setVotingPeriod', [32n]),
              },
            ],
            '<proposal description>',
          );

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: VoteType.For });
          await this.helper.waitForDeadline();

          await expect(this.helper.execute()).to.emit(this.mock, 'VotingPeriodSet').withArgs(16n, 32n);

          expect(await this.mock.votingPeriod()).to.equal(32n);
        });

        it('cannot setVotingPeriod to 0 through governance', async function () {
          const votingPeriod = 0n;

          this.helper.setProposal(
            [
              {
                target: this.mock.target,
                data: this.mock.interface.encodeFunctionData('setVotingPeriod', [votingPeriod]),
              },
            ],
            '<proposal description>',
          );

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: VoteType.For });
          await this.helper.waitForDeadline();

          await expect(this.helper.execute())
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidVotingPeriod')
            .withArgs(votingPeriod);
        });

        it('can setProposalThreshold to 0 through governance', async function () {
          this.helper.setProposal(
            [
              {
                target: this.mock.target,
                data: this.mock.interface.encodeFunctionData('setProposalThreshold', [1_000_000_000_000_000_000n]),
              },
            ],
            '<proposal description>',
          );

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: VoteType.For });
          await this.helper.waitForDeadline();

          await expect(this.helper.execute())
            .to.emit(this.mock, 'ProposalThresholdSet')
            .withArgs(0n, 1_000_000_000_000_000_000n);

          expect(await this.mock.proposalThreshold()).to.equal(1_000_000_000_000_000_000n);
        });
      });

      describe('safe receive', function () {
        describe('ERC721', function () {
          const tokenId = 1n;

          beforeEach(async function () {
            this.token = await ethers.deployContract('$ERC721', ['Non Fungible Token', 'NFT']);
            await this.token.$_mint(this.owner, tokenId);
          });

          it('can receive an ERC721 safeTransfer', async function () {
            await this.token.connect(this.owner).safeTransferFrom(this.owner, this.mock, tokenId);
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
            await this.token.$_mintBatch(this.owner, Object.keys(tokenIds), Object.values(tokenIds), '0x');
          });

          it('can receive ERC1155 safeTransfer', async function () {
            await this.token.connect(this.owner).safeTransferFrom(
              this.owner,
              this.mock,
              ...Object.entries(tokenIds)[0], // id + amount
              '0x',
            );
          });

          it('can receive ERC1155 safeBatchTransfer', async function () {
            await this.token
              .connect(this.owner)
              .safeBatchTransferFrom(this.owner, this.mock, Object.keys(tokenIds), Object.values(tokenIds), '0x');
          });
        });
      });
    });
  }
});
