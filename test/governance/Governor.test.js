const { ethers, web3 } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { bigint: Enums } = require('../helpers/enums');
const { getDomain } = require('../helpers/eip712');
const { GovernorHelper, proposalStatesToBitMap } = require('../helpers/governance');
const {
  bigint: { clockFromReceipt },
} = require('../helpers/time');

const { shouldSupportInterfaces } = require('../utils/introspection/SupportsInterface.behavior');
const { bigint: shouldBehaveLikeEIP6372 } = require('./utils/EIP6372.behavior');

const Governor = '$GovernorMock';
const CallReceiver = 'CallReceiverMock';
const ERC721 = '$ERC721';
const ERC1155 = '$ERC1155';
const ERC1271WalletMock = 'ERC1271WalletMock';

const TOKENS = [
  { Token: '$ERC20Votes', mode: 'blocknumber' },
  // { Token: '$ERC20VotesTimestampMock', mode: 'timestamp' },
  // { Token: '$ERC20VotesLegacyMock', mode: 'blocknumber' },
];

describe.only('Governor', function () {
  const name = 'OZ-Governor';
  const version = '1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = ethers.parseEther('100');
  const votingDelay = 4;
  const votingPeriod = 16;
  const value = ethers.parseEther('1');

  for (const { mode, Token } of TOKENS) {
    const deployToken = async () => {
      try {
        return await ethers.deployContract(Token, [tokenName, tokenSymbol, tokenName, version]);
      } catch {
        // ERC20VotesLegacyMock has a different construction that uses version='1' by default.
        return ethers.deployContract(Token, [tokenName, tokenSymbol, tokenName]);
      }
    };

    const fixture = async () => {
      const [owner, proposer, voter1, voter2, voter3, voter4, userEOA] = await ethers.getSigners();
      const token = await deployToken();
      const mock = await ethers.deployContract(Governor, [
        name, // name
        votingDelay, // initialVotingDelay
        votingPeriod, // initialVotingPeriod
        0, // initialProposalThreshold
        token, // tokenAddress
        10, // quorumNumeratorValue
      ]);
      const receiver = await ethers.deployContract(CallReceiver);

      const helperTmp = new GovernorHelper(mock, mode);

      await owner.sendTransaction({ to: mock, value });

      await token.$_mint(owner, tokenSupply);
      await helperTmp.connect(owner).delegate({ token: token, to: voter1, value: ethers.parseEther('10') });
      await helperTmp.connect(owner).delegate({ token: token, to: voter2, value: ethers.parseEther('7') });
      await helperTmp.connect(owner).delegate({ token: token, to: voter3, value: ethers.parseEther('5') });
      await helperTmp.connect(owner).delegate({ token: token, to: voter4, value: ethers.parseEther('2') });

      const helper = helperTmp.setProposal(
        [
          {
            target: receiver.target,
            data: receiver.interface.encodeFunctionData('mockFunction'),
            value,
          },
        ],
        '<proposal description>',
      );

      const proposal = helper.currentProposal;

      return { owner, proposer, voter1, voter2, voter3, voter4, userEOA, token, mock, receiver, helper, proposal };
    };

    describe(`using ${Token}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
      });

      shouldSupportInterfaces(['ERC165', 'ERC1155Receiver', 'Governor']);
      shouldBehaveLikeEIP6372(mode);

      it('deployment check', async function () {
        expect(await this.mock.name()).to.be.equal(name);
        expect(await this.mock.token()).to.be.equal(this.token.target);
        expect(await this.mock.votingDelay()).to.be.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.be.equal(votingPeriod);
        expect(await this.mock.quorum(0)).to.be.equal('0');
        expect(await this.mock.COUNTING_MODE()).to.be.equal('support=bravo&quorum=for,abstain');
      });

      it('nominal workflow', async function () {
        // Before
        expect(await this.mock.proposalProposer(this.proposal.id)).to.be.equal(ethers.ZeroAddress);
        expect(await this.mock.hasVoted(this.proposal.id, this.owner)).to.be.equal(false);
        expect(await this.mock.hasVoted(this.proposal.id, this.voter1)).to.be.equal(false);
        expect(await this.mock.hasVoted(this.proposal.id, this.voter2)).to.be.equal(false);
        expect(await ethers.provider.getBalance(this.mock)).to.be.equal(value);
        expect(await ethers.provider.getBalance(this.receiver)).to.be.equal('0');

        expect(await this.mock.proposalEta(this.proposal.id)).to.be.equal('0');
        expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.equal(false);

        // Run proposal
        const txPropose = await this.helper.connect(this.proposer).propose();

        await expect(txPropose)
          .to.emit(this.mock, 'ProposalCreated')
          .withArgs(
            this.proposal.id,
            this.proposer.address,
            this.proposal.targets,
            this.proposal.values,
            this.proposal.signatures,
            this.proposal.data,
            (await clockFromReceipt[mode](txPropose)) + votingDelay,
            (await clockFromReceipt[mode](txPropose)) + votingDelay + votingPeriod,
            this.proposal.description,
          );

        await this.helper.waitForSnapshot();

        await expect(this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For, reason: 'This is nice' }))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter1.address, this.proposal.id, Enums.VoteType.For, ethers.parseEther('10'), 'This is nice');

        await expect(this.helper.connect(this.voter2).vote({ support: Enums.VoteType.For }))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter2.address, this.proposal.id, Enums.VoteType.For, ethers.parseEther('7'), '');

        await expect(this.helper.connect(this.voter3).vote({ support: Enums.VoteType.Against }))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter3.address, this.proposal.id, Enums.VoteType.Against, ethers.parseEther('5'), '');

        await expect(this.helper.connect(this.voter4).vote({ support: Enums.VoteType.Abstain }))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter4.address, this.proposal.id, Enums.VoteType.Abstain, ethers.parseEther('2'), '');

        await this.helper.waitForDeadline();

        const txExecute = await this.helper.execute();

        await expect(txExecute).to.emit(this.mock, 'ProposalExecuted').withArgs(this.proposal.id);

        await expect(txExecute).to.emit(this.receiver, 'MockFunctionCalled');

        // After
        expect(await this.mock.proposalProposer(this.proposal.id)).to.be.equal(this.proposer.address);
        expect(await this.mock.hasVoted(this.proposal.id, this.owner)).to.be.equal(false);
        expect(await this.mock.hasVoted(this.proposal.id, this.voter1)).to.be.equal(true);
        expect(await this.mock.hasVoted(this.proposal.id, this.voter2)).to.be.equal(true);
        expect(await ethers.provider.getBalance(this.mock)).to.be.equal(0);
        expect(await ethers.provider.getBalance(this.receiver)).to.be.equal(value);

        expect(await this.mock.proposalEta(this.proposal.id)).to.be.equal(0);
        expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.equal(false);
      });

      it('send ethers', async function () {
        const helper = this.helper.setProposal(
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
          await helper.propose();
          await helper.waitForSnapshot();
          await helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
          await helper.waitForDeadline();
          return helper.execute();
        }).to.changeEtherBalances([this.mock, this.userEOA], [-value, value]);
      });

      describe('vote with signature', function () {
        const sign = account => async (contract, message) => {
          const domain = await getDomain(contract);
          const types = {
            Ballot: [
              { name: 'proposalId', type: 'uint256' },
              { name: 'support', type: 'uint8' },
              { name: 'voter', type: 'address' },
              { name: 'nonce', type: 'uint256' },
            ],
          };
          return account.signTypedData(domain, types, message);
        };

        it('votes with an EOA signature', async function () {
          await this.token.connect(this.voter1).delegate(this.userEOA);

          const nonce = await this.mock.nonces(this.userEOA);

          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await expect(
            await this.helper.vote({
              support: Enums.VoteType.For,
              voter: this.userEOA.address,
              nonce,
              signature: sign(this.userEOA),
            }),
          )
            .to.emit(this.mock, 'VoteCast')
            .withArgs(this.userEOA.address, this.proposal.id, Enums.VoteType.For, ethers.parseEther('10'), '');

          await this.helper.waitForDeadline();
          await this.helper.execute();

          // After
          expect(await this.mock.hasVoted(this.proposal.id, this.userEOA)).to.be.equal(true);
          expect(await this.mock.nonces(this.userEOA)).to.be.equal(nonce + 1n);
        });

        it('votes with a valid EIP-1271 signature', async function () {
          const wallet = await ethers.deployContract(ERC1271WalletMock, [this.userEOA]);

          await this.token.connect(this.voter1).delegate(wallet);

          const nonce = await this.mock.nonces(this.userEOA);

          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await expect(
            await this.helper.vote({
              support: Enums.VoteType.For,
              voter: wallet.target,
              nonce,
              signature: sign(this.userEOA),
            }),
          )
            .to.emit(this.mock, 'VoteCast')
            .withArgs(wallet.target, this.proposal.id, Enums.VoteType.For, ethers.parseEther('10'), '');
          await this.helper.waitForDeadline();
          await this.helper.execute();

          // After
          expect(await this.mock.hasVoted(this.proposal.id, wallet)).to.be.equal(true);
          expect(await this.mock.nonces(wallet)).to.be.equal(nonce + 1n);
        });

        afterEach('no other votes are cast', async function () {
          expect(await this.mock.hasVoted(this.proposal.id, this.owner)).to.be.equal(false);
          expect(await this.mock.hasVoted(this.proposal.id, this.voter1)).to.be.equal(false);
          expect(await this.mock.hasVoted(this.proposal.id, this.voter2)).to.be.equal(false);
        });
      });

      describe('should revert', function () {
        describe('on propose', function () {
          it('if proposal already exists', async function () {
            await this.helper.propose();
            await expect(this.helper.propose())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(this.proposal.id, Enums.ProposalState.Pending, ethers.ZeroHash);
          });

          it('if proposer has below threshold votes', async function () {
            const votes = ethers.parseEther('10');
            const threshold = ethers.parseEther('1000');
            await this.mock.$_setProposalThreshold(threshold);
            await expect(this.helper.connect(this.voter1).propose())
              .to.be.revertedWithCustomError(this.mock, 'GovernorInsufficientProposerVotes')
              .withArgs(this.voter1.address, votes, threshold);
          });
        });

        describe('on vote', function () {
          it('if proposal does not exist', async function () {
            await expect(this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For }))
              .to.be.revertedWithCustomError(this.mock, 'GovernorNonexistentProposal')
              .withArgs(this.proposal.id);
          });

          it('if voting has not started', async function () {
            await this.helper.propose();
            await expect(this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For }))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                Enums.ProposalState.Pending,
                proposalStatesToBitMap([Enums.ProposalState.Active]),
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
            await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
            await expect(this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For }))
              .to.be.revertedWithCustomError(this.mock, 'GovernorAlreadyCastVote')
              .withArgs(this.voter1.address);
          });

          it('if voting is over', async function () {
            await this.helper.propose();
            await this.helper.waitForDeadline();
            await expect(this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For }))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                Enums.ProposalState.Defeated,
                proposalStatesToBitMap([Enums.ProposalState.Active]),
              );
          });
        });

        describe('on vote by signature', function () {
          beforeEach(async function () {
            this.signature = async (contract, message) => {
              const domain = await getDomain(contract);
              const types = {
                Ballot: [
                  { name: 'proposalId', type: 'uint256' },
                  { name: 'support', type: 'uint8' },
                  { name: 'voter', type: 'address' },
                  { name: 'nonce', type: 'uint256' },
                ],
              };
              return this.userEOA.signTypedData(domain, types, message);
            };

            await this.token.connect(this.voter1).delegate(this.userEOA);

            // Run proposal
            await this.helper.propose();
            await this.helper.waitForSnapshot();
          });

          it('if signature does not match signer', async function () {
            const nonce = await this.mock.nonces(this.userEOA);

            function tamper(str, index, input) {
              const middle = Number.parseInt(str.slice(index + 2, index + 4), 16);
              const middleStr = (middle ^ input).toString(16).padStart(2, '0');

              return `${str.slice(0, index + 2)}${middleStr}${str.slice(index + 4)}`;
            }

            const voteParams = {
              support: Enums.VoteType.For,
              voter: this.userEOA.address,
              nonce,
              signature: async (...params) => {
                const sig = await this.signature(...params);
                return tamper(sig, 42, 0xff);
              },
            };

            await expect(this.helper.vote(voteParams))
              .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidSignature')
              .withArgs(voteParams.voter);
          });

          it('if vote nonce is incorrect', async function () {
            const nonce = await this.mock.nonces(this.userEOA);

            const voteParams = {
              support: Enums.VoteType.For,
              voter: this.userEOA.address,
              nonce: nonce + 1n,
              signature: this.signature,
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
            await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
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
            await this.helper.connect(this.voter3).vote({ support: Enums.VoteType.For });
            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                Enums.ProposalState.Active,
                proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
              );
          });

          it('if score not reached', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.Against });
            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                Enums.ProposalState.Active,
                proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
              );
          });

          it('if voting is not over', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                Enums.ProposalState.Active,
                proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
              );
          });

          it('if receiver revert without reason', async function () {
            const helper = this.helper.setProposal(
              [
                {
                  target: this.receiver.target,
                  data: this.receiver.interface.encodeFunctionData('mockFunctionRevertsNoReason'),
                },
              ],
              '<proposal description>',
            );

            await helper.propose();
            await helper.waitForSnapshot();
            await helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
            await helper.waitForDeadline();
            await expect(helper.execute()).to.be.revertedWithCustomError(this.mock, 'FailedInnerCall');
          });

          it('if receiver revert with reason', async function () {
            const helper = this.helper.setProposal(
              [
                {
                  target: this.receiver.target,
                  data: this.receiver.interface.encodeFunctionData('mockFunctionRevertsReason'),
                },
              ],
              '<proposal description>',
            );

            await helper.propose();
            await helper.waitForSnapshot();
            await helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
            await helper.waitForDeadline();
            await expect(helper.execute()).to.be.revertedWith('CallReceiverMock: reverting');
          });

          it('if proposal was already executed', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
            await this.helper.waitForDeadline();
            await this.helper.execute();
            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                Enums.ProposalState.Executed,
                proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
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
          expect(await this.mock.state(this.proposal.id)).to.be.equal(Enums.ProposalState.Pending);
          await this.helper.waitForSnapshot();
          expect(await this.mock.state(this.proposal.id)).to.be.equal(Enums.ProposalState.Pending);
          await this.helper.waitForSnapshot(1n);
          expect(await this.mock.state(this.proposal.id)).to.be.equal(Enums.ProposalState.Active);
        });

        it('Defeated', async function () {
          await this.helper.propose();
          await this.helper.waitForDeadline();
          expect(await this.mock.state(this.proposal.id)).to.be.equal(Enums.ProposalState.Active);
          await this.helper.waitForDeadline(1n);
          expect(await this.mock.state(this.proposal.id)).to.be.equal(Enums.ProposalState.Defeated);
        });

        it('Succeeded', async function () {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
          await this.helper.waitForDeadline();
          expect(await this.mock.state(this.proposal.id)).to.be.equal(Enums.ProposalState.Active);
          await this.helper.waitForDeadline(1n);
          expect(await this.mock.state(this.proposal.id)).to.be.equal(Enums.ProposalState.Succeeded);
        });

        it('Executed', async function () {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
          await this.helper.waitForDeadline();
          await this.helper.execute();
          expect(await this.mock.state(this.proposal.id)).to.be.equal(Enums.ProposalState.Executed);
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
            expect(await this.mock.state(this.proposal.id)).to.be.equal(Enums.ProposalState.Canceled);

            await this.helper.waitForSnapshot();
            await expect(this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For }))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                Enums.ProposalState.Canceled,
                proposalStatesToBitMap([Enums.ProposalState.Active]),
              );
          });

          it('after vote', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });

            await this.helper.cancel('internal');
            expect(await this.mock.state(this.proposal.id)).to.be.equal(Enums.ProposalState.Canceled);

            await this.helper.waitForDeadline();
            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                Enums.ProposalState.Canceled,
                proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
              );
          });

          it('after deadline', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
            await this.helper.waitForDeadline();

            await this.helper.cancel('internal');
            expect(await this.mock.state(this.proposal.id)).to.be.equal(Enums.ProposalState.Canceled);

            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                Enums.ProposalState.Canceled,
                proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
              );
          });

          it('after execution', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
            await this.helper.waitForDeadline();
            await this.helper.execute();

            await expect(this.helper.cancel('internal'))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                Enums.ProposalState.Executed,
                proposalStatesToBitMap(
                  [Enums.ProposalState.Canceled, Enums.ProposalState.Expired, Enums.ProposalState.Executed],
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
              .withArgs(this.owner.address);
          });

          it('after vote started', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot(1n); // snapshot + 1 block

            await expect(this.helper.cancel('external'))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                Enums.ProposalState.Active,
                proposalStatesToBitMap([Enums.ProposalState.Pending]),
              );
          });

          it('after vote', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });

            await expect(this.helper.cancel('external'))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                Enums.ProposalState.Active,
                proposalStatesToBitMap([Enums.ProposalState.Pending]),
              );
          });

          it('after deadline', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
            await this.helper.waitForDeadline();

            await expect(this.helper.cancel('external'))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                Enums.ProposalState.Succeeded,
                proposalStatesToBitMap([Enums.ProposalState.Pending]),
              );
          });

          it('after execution', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
            await this.helper.waitForDeadline();
            await this.helper.execute();

            await expect(this.helper.cancel('external'))
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                Enums.ProposalState.Executed,
                proposalStatesToBitMap([Enums.ProposalState.Pending]),
              );
          });
        });
      });

      describe('proposal length', function () {
        it('empty', async function () {
          const helper = this.helper.setProposal([], '<proposal description>');
          await expect(helper.propose())
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidProposalLength')
            .withArgs(0, 0, 0);
        });

        it('mismatch #1', async function () {
          const helper = this.helper.setProposal(
            {
              targets: [],
              values: [ethers.parseEther('0')],
              data: [this.receiver.interface.encodeFunctionData('mockFunction')],
            },
            '<proposal description>',
          );
          await expect(helper.propose())
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidProposalLength')
            .withArgs(0, 1, 1);
        });

        it('mismatch #2', async function () {
          const helper = this.helper.setProposal(
            {
              targets: [this.receiver.target],
              values: [],
              data: [this.receiver.interface.encodeFunctionData('mockFunction')],
            },
            '<proposal description>',
          );
          await expect(helper.propose())
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidProposalLength')
            .withArgs(1, 1, 0);
        });

        it('mismatch #3', async function () {
          const helper = this.helper.setProposal(
            {
              targets: [this.receiver.target],
              values: [ethers.parseEther('0')],
              data: [],
            },
            '<proposal description>',
          );
          await expect(helper.propose())
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidProposalLength')
            .withArgs(1, 0, 1);
        });
      });

      describe('frontrun protection using description suffix', function () {
        describe('without protection', function () {
          describe('without suffix', function () {
            it('proposer can propose', async function () {
              const txPropose = await this.helper.connect(this.proposer).propose();
              await expect(txPropose)
                .to.emit(this.mock, 'ProposalCreated')
                .withArgs(
                  this.proposal.id,
                  this.proposer.address,
                  this.proposal.targets,
                  this.proposal.values,
                  this.proposal.signatures,
                  this.proposal.data,
                  (await clockFromReceipt[mode](txPropose)) + votingDelay,
                  (await clockFromReceipt[mode](txPropose)) + votingDelay + votingPeriod,
                  this.proposal.description,
                );
            });

            it('someone else can propose', async function () {
              const txPropose = this.helper.connect(this.voter1).propose();
              await expect(txPropose)
                .to.emit(this.mock, 'ProposalCreated')
                .withArgs(
                  this.proposal.id,
                  this.voter1.address,
                  this.proposal.targets,
                  this.proposal.values,
                  this.proposal.signatures,
                  this.proposal.data,
                  (await clockFromReceipt[mode](txPropose)) + votingDelay,
                  (await clockFromReceipt[mode](txPropose)) + votingDelay + votingPeriod,
                  this.proposal.description,
                );
            });
          });

          describe('with different suffix', function () {
            beforeEach(async function () {
              this.proposal = this.helper.setProposal(
                [
                  {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                  },
                ],
                `<proposal description>#wrong-suffix=${proposer}`,
              );
            });

            it('proposer can propose', async function () {
              expectEvent(await this.helper.propose({ from: proposer }), 'ProposalCreated');
            });

            it('someone else can propose', async function () {
              expectEvent(await this.helper.propose({ from: voter1 }), 'ProposalCreated');
            });
          });

          describe('with proposer suffix but bad address part', function () {
            beforeEach(async function () {
              this.proposal = this.helper.setProposal(
                [
                  {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                  },
                ],
                `<proposal description>#proposer=0x3C44CdDdB6a900fa2b585dd299e03d12FA429XYZ`, // XYZ are not a valid hex char
              );
            });

            it('propose can propose', async function () {
              expectEvent(await this.helper.propose({ from: proposer }), 'ProposalCreated');
            });

            it('someone else can propose', async function () {
              expectEvent(await this.helper.propose({ from: voter1 }), 'ProposalCreated');
            });
          });
        });

        describe('with protection via proposer suffix', function () {
          beforeEach(async function () {
            this.proposal = this.helper.setProposal(
              [
                {
                  target: this.receiver.address,
                  data: this.receiver.contract.methods.mockFunction().encodeABI(),
                  value,
                },
              ],
              `<proposal description>#proposer=${proposer}`,
            );
          });

          it('proposer can propose', async function () {
            expectEvent(await this.helper.propose({ from: proposer }), 'ProposalCreated');
          });

          it('someone else cannot propose', async function () {
            await expectRevertCustomError(this.helper.propose({ from: voter1 }), 'GovernorRestrictedProposer', [
              voter1,
            ]);
          });
        });
      });

      describe('onlyGovernance updates', function () {
        it('setVotingDelay is protected', async function () {
          await expectRevertCustomError(this.mock.setVotingDelay('0', { from: owner }), 'GovernorOnlyExecutor', [
            owner,
          ]);
        });

        it('setVotingPeriod is protected', async function () {
          await expectRevertCustomError(this.mock.setVotingPeriod('32', { from: owner }), 'GovernorOnlyExecutor', [
            owner,
          ]);
        });

        it('setProposalThreshold is protected', async function () {
          await expectRevertCustomError(
            this.mock.setProposalThreshold('1000000000000000000', { from: owner }),
            'GovernorOnlyExecutor',
            [owner],
          );
        });

        it('can setVotingDelay through governance', async function () {
          this.helper.setProposal(
            [
              {
                target: this.mock.address,
                data: this.mock.contract.methods.setVotingDelay('0').encodeABI(),
              },
            ],
            '<proposal description>',
          );

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();

          expectEvent(await this.helper.execute(), 'VotingDelaySet', { oldVotingDelay: '4', newVotingDelay: '0' });

          expect(await this.mock.votingDelay()).to.be.bignumber.equal('0');
        });

        it('can setVotingPeriod through governance', async function () {
          this.helper.setProposal(
            [
              {
                target: this.mock.address,
                data: this.mock.contract.methods.setVotingPeriod('32').encodeABI(),
              },
            ],
            '<proposal description>',
          );

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();

          expectEvent(await this.helper.execute(), 'VotingPeriodSet', { oldVotingPeriod: '16', newVotingPeriod: '32' });

          expect(await this.mock.votingPeriod()).to.be.bignumber.equal('32');
        });

        it('cannot setVotingPeriod to 0 through governance', async function () {
          const votingPeriod = 0;
          this.helper.setProposal(
            [
              {
                target: this.mock.address,
                data: this.mock.contract.methods.setVotingPeriod(votingPeriod).encodeABI(),
              },
            ],
            '<proposal description>',
          );

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();

          await expectRevertCustomError(this.helper.execute(), 'GovernorInvalidVotingPeriod', [votingPeriod]);
        });

        it('can setProposalThreshold to 0 through governance', async function () {
          this.helper.setProposal(
            [
              {
                target: this.mock.address,
                data: this.mock.contract.methods.setProposalThreshold('1000000000000000000').encodeABI(),
              },
            ],
            '<proposal description>',
          );

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();

          expectEvent(await this.helper.execute(), 'ProposalThresholdSet', {
            oldProposalThreshold: '0',
            newProposalThreshold: '1000000000000000000',
          });

          expect(await this.mock.proposalThreshold()).to.be.bignumber.equal('1000000000000000000');
        });
      });

      describe('safe receive', function () {
        describe('ERC721', function () {
          const name = 'Non Fungible Token';
          const symbol = 'NFT';
          const tokenId = web3.utils.toBN(1);

          beforeEach(async function () {
            this.token = await ERC721.new(name, symbol);
            await this.token.$_mint(owner, tokenId);
          });

          it('can receive an ERC721 safeTransfer', async function () {
            await this.token.safeTransferFrom(owner, this.mock.address, tokenId, { from: owner });
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

          it('can receive ERC1155 safeTransfer', async function () {
            await this.token.safeTransferFrom(
              owner,
              this.mock.address,
              ...Object.entries(tokenIds)[0], // id + amount
              '0x',
              { from: owner },
            );
          });

          it('can receive ERC1155 safeBatchTransfer', async function () {
            await this.token.safeBatchTransferFrom(
              owner,
              this.mock.address,
              Object.keys(tokenIds),
              Object.values(tokenIds),
              '0x',
              { from: owner },
            );
          });
        });
      });
    });
  }
});
