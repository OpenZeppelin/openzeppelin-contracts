const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const Enums = require('../helpers/enums');
const { getDomain, domainType } = require('../helpers/eip712');
const { GovernorHelper, proposalStatesToBitMap } = require('../helpers/governance');
const { clockFromReceipt } = require('../helpers/time');
const { expectRevertCustomError } = require('../helpers/customError');

const { shouldSupportInterfaces } = require('../utils/introspection/SupportsInterface.behavior');
const { shouldBehaveLikeEIP6372 } = require('./utils/EIP6372.behavior');
const { ZERO_BYTES32 } = require('@openzeppelin/test-helpers/src/constants');

const Governor = artifacts.require('$GovernorMock');
const CallReceiver = artifacts.require('CallReceiverMock');
const ERC721 = artifacts.require('$ERC721');
const ERC1155 = artifacts.require('$ERC1155');
const ERC1271WalletMock = artifacts.require('ERC1271WalletMock');

const TOKENS = [
  { Token: artifacts.require('$ERC20Votes'), mode: 'blocknumber' },
  { Token: artifacts.require('$ERC20VotesTimestampMock'), mode: 'timestamp' },
  { Token: artifacts.require('$ERC20VotesLegacyMock'), mode: 'blocknumber' },
];

contract('Governor', function (accounts) {
  const [owner, proposer, voter1, voter2, voter3, voter4] = accounts;

  const name = 'OZ-Governor';
  const version = '1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');
  const votingDelay = web3.utils.toBN(4);
  const votingPeriod = web3.utils.toBN(16);
  const value = web3.utils.toWei('1');

  for (const { mode, Token } of TOKENS) {
    describe(`using ${Token._json.contractName}`, function () {
      beforeEach(async function () {
        this.chainId = await web3.eth.getChainId();
        try {
          this.token = await Token.new(tokenName, tokenSymbol, tokenName, version);
        } catch {
          // ERC20VotesLegacyMock has a different construction that uses version='1' by default.
          this.token = await Token.new(tokenName, tokenSymbol, tokenName);
        }
        this.mock = await Governor.new(
          name, // name
          votingDelay, // initialVotingDelay
          votingPeriod, // initialVotingPeriod
          0, // initialProposalThreshold
          this.token.address, // tokenAddress
          10, // quorumNumeratorValue
        );
        this.receiver = await CallReceiver.new();

        this.helper = new GovernorHelper(this.mock, mode);

        await web3.eth.sendTransaction({ from: owner, to: this.mock.address, value });

        await this.token.$_mint(owner, tokenSupply);
        await this.helper.delegate({ token: this.token, to: voter1, value: web3.utils.toWei('10') }, { from: owner });
        await this.helper.delegate({ token: this.token, to: voter2, value: web3.utils.toWei('7') }, { from: owner });
        await this.helper.delegate({ token: this.token, to: voter3, value: web3.utils.toWei('5') }, { from: owner });
        await this.helper.delegate({ token: this.token, to: voter4, value: web3.utils.toWei('2') }, { from: owner });

        this.proposal = this.helper.setProposal(
          [
            {
              target: this.receiver.address,
              data: this.receiver.contract.methods.mockFunction().encodeABI(),
              value,
            },
          ],
          '<proposal description>',
        );
      });

      shouldSupportInterfaces(['ERC165', 'ERC1155Receiver', 'Governor']);
      shouldBehaveLikeEIP6372(mode);

      it('deployment check', async function () {
        expect(await this.mock.name()).to.be.equal(name);
        expect(await this.mock.token()).to.be.equal(this.token.address);
        expect(await this.mock.votingDelay()).to.be.bignumber.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.be.bignumber.equal(votingPeriod);
        expect(await this.mock.quorum(0)).to.be.bignumber.equal('0');
        expect(await this.mock.COUNTING_MODE()).to.be.equal('support=bravo&quorum=for,abstain');
      });

      it('nominal workflow', async function () {
        // Before
        expect(await this.mock.proposalProposer(this.proposal.id)).to.be.equal(constants.ZERO_ADDRESS);
        expect(await this.mock.hasVoted(this.proposal.id, owner)).to.be.equal(false);
        expect(await this.mock.hasVoted(this.proposal.id, voter1)).to.be.equal(false);
        expect(await this.mock.hasVoted(this.proposal.id, voter2)).to.be.equal(false);
        expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal(value);
        expect(await web3.eth.getBalance(this.receiver.address)).to.be.bignumber.equal('0');

        // Run proposal
        const txPropose = await this.helper.propose({ from: proposer });

        expectEvent(txPropose, 'ProposalCreated', {
          proposalId: this.proposal.id,
          proposer,
          targets: this.proposal.targets,
          // values: this.proposal.values,
          signatures: this.proposal.signatures,
          calldatas: this.proposal.data,
          voteStart: web3.utils.toBN(await clockFromReceipt[mode](txPropose.receipt)).add(votingDelay),
          voteEnd: web3.utils
            .toBN(await clockFromReceipt[mode](txPropose.receipt))
            .add(votingDelay)
            .add(votingPeriod),
          description: this.proposal.description,
        });

        await this.helper.waitForSnapshot();

        expectEvent(
          await this.helper.vote({ support: Enums.VoteType.For, reason: 'This is nice' }, { from: voter1 }),
          'VoteCast',
          {
            voter: voter1,
            support: Enums.VoteType.For,
            reason: 'This is nice',
            weight: web3.utils.toWei('10'),
          },
        );

        expectEvent(await this.helper.vote({ support: Enums.VoteType.For }, { from: voter2 }), 'VoteCast', {
          voter: voter2,
          support: Enums.VoteType.For,
          weight: web3.utils.toWei('7'),
        });

        expectEvent(await this.helper.vote({ support: Enums.VoteType.Against }, { from: voter3 }), 'VoteCast', {
          voter: voter3,
          support: Enums.VoteType.Against,
          weight: web3.utils.toWei('5'),
        });

        expectEvent(await this.helper.vote({ support: Enums.VoteType.Abstain }, { from: voter4 }), 'VoteCast', {
          voter: voter4,
          support: Enums.VoteType.Abstain,
          weight: web3.utils.toWei('2'),
        });

        await this.helper.waitForDeadline();

        const txExecute = await this.helper.execute();

        expectEvent(txExecute, 'ProposalExecuted', { proposalId: this.proposal.id });

        await expectEvent.inTransaction(txExecute.tx, this.receiver, 'MockFunctionCalled');

        // After
        expect(await this.mock.proposalProposer(this.proposal.id)).to.be.equal(proposer);
        expect(await this.mock.hasVoted(this.proposal.id, owner)).to.be.equal(false);
        expect(await this.mock.hasVoted(this.proposal.id, voter1)).to.be.equal(true);
        expect(await this.mock.hasVoted(this.proposal.id, voter2)).to.be.equal(true);
        expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal('0');
        expect(await web3.eth.getBalance(this.receiver.address)).to.be.bignumber.equal(value);
      });

      it('send ethers', async function () {
        const empty = web3.utils.toChecksumAddress(web3.utils.randomHex(20));

        this.proposal = this.helper.setProposal(
          [
            {
              target: empty,
              value,
            },
          ],
          '<proposal description>',
        );

        // Before
        expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal(value);
        expect(await web3.eth.getBalance(empty)).to.be.bignumber.equal('0');

        // Run proposal
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.waitForDeadline();
        await this.helper.execute();

        // After
        expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal('0');
        expect(await web3.eth.getBalance(empty)).to.be.bignumber.equal(value);
      });

      describe('vote with signature', function () {
        const sign = privateKey => async (contract, message) => {
          const domain = await getDomain(contract);
          return ethSigUtil.signTypedMessage(privateKey, {
            data: {
              primaryType: 'Ballot',
              types: {
                EIP712Domain: domainType(domain),
                Ballot: [
                  { name: 'proposalId', type: 'uint256' },
                  { name: 'support', type: 'uint8' },
                  { name: 'voter', type: 'address' },
                  { name: 'nonce', type: 'uint256' },
                ],
              },
              domain,
              message,
            },
          });
        };

        afterEach('no other votes are cast for proposalId', async function () {
          expect(await this.mock.hasVoted(this.proposal.id, owner)).to.be.equal(false);
          expect(await this.mock.hasVoted(this.proposal.id, voter1)).to.be.equal(false);
          expect(await this.mock.hasVoted(this.proposal.id, voter2)).to.be.equal(false);
        });

        it('votes with an EOA signature', async function () {
          const voterBySig = Wallet.generate();
          const voterBySigAddress = web3.utils.toChecksumAddress(voterBySig.getAddressString());

          await this.token.delegate(voterBySigAddress, { from: voter1 });

          const nonce = await this.mock.nonces(voterBySigAddress);

          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          expectEvent(
            await this.helper.vote({
              support: Enums.VoteType.For,
              voter: voterBySigAddress,
              nonce,
              signature: sign(voterBySig.getPrivateKey()),
            }),
            'VoteCast',
            {
              voter: voterBySigAddress,
              support: Enums.VoteType.For,
            },
          );
          await this.helper.waitForDeadline();
          await this.helper.execute();

          // After
          expect(await this.mock.hasVoted(this.proposal.id, voterBySigAddress)).to.be.equal(true);
          expect(await this.mock.nonces(voterBySigAddress)).to.be.bignumber.equal(nonce.addn(1));
        });

        it('votes with a valid EIP-1271 signature', async function () {
          const ERC1271WalletOwner = Wallet.generate();
          ERC1271WalletOwner.address = web3.utils.toChecksumAddress(ERC1271WalletOwner.getAddressString());

          const wallet = await ERC1271WalletMock.new(ERC1271WalletOwner.address);

          await this.token.delegate(wallet.address, { from: voter1 });

          const nonce = await this.mock.nonces(wallet.address);

          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          expectEvent(
            await this.helper.vote({
              support: Enums.VoteType.For,
              voter: wallet.address,
              nonce,
              signature: sign(ERC1271WalletOwner.getPrivateKey()),
            }),
            'VoteCast',
            {
              voter: wallet.address,
              support: Enums.VoteType.For,
            },
          );
          await this.helper.waitForDeadline();
          await this.helper.execute();

          // After
          expect(await this.mock.hasVoted(this.proposal.id, wallet.address)).to.be.equal(true);
          expect(await this.mock.nonces(wallet.address)).to.be.bignumber.equal(nonce.addn(1));
        });

        afterEach('no other votes are cast', async function () {
          expect(await this.mock.hasVoted(this.proposal.id, owner)).to.be.equal(false);
          expect(await this.mock.hasVoted(this.proposal.id, voter1)).to.be.equal(false);
          expect(await this.mock.hasVoted(this.proposal.id, voter2)).to.be.equal(false);
        });
      });

      describe('should revert', function () {
        describe('on propose', function () {
          it('if proposal already exists', async function () {
            await this.helper.propose();
            await expectRevertCustomError(this.helper.propose(), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Pending,
              ZERO_BYTES32,
            ]);
          });

          it('if proposer has below threshold votes', async function () {
            const votes = web3.utils.toWei('10');
            const threshold = web3.utils.toWei('1000');
            await this.mock.$_setProposalThreshold(threshold);
            await expectRevertCustomError(this.helper.propose({ from: voter1 }), 'GovernorInsufficientProposerVotes', [
              voter1,
              votes,
              threshold,
            ]);
          });
        });

        describe('on vote', function () {
          it('if proposal does not exist', async function () {
            await expectRevertCustomError(
              this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 }),
              'GovernorNonexistentProposal',
              [this.proposal.id],
            );
          });

          it('if voting has not started', async function () {
            await this.helper.propose();
            await expectRevertCustomError(
              this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 }),
              'GovernorUnexpectedProposalState',
              [this.proposal.id, Enums.ProposalState.Pending, proposalStatesToBitMap([Enums.ProposalState.Active])],
            );
          });

          it('if support value is invalid', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await expectRevertCustomError(
              this.helper.vote({ support: web3.utils.toBN('255') }),
              'GovernorInvalidVoteType',
              [],
            );
          });

          it('if vote was already casted', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await expectRevertCustomError(
              this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 }),
              'GovernorAlreadyCastVote',
              [voter1],
            );
          });

          it('if voting is over', async function () {
            await this.helper.propose();
            await this.helper.waitForDeadline();
            await expectRevertCustomError(
              this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 }),
              'GovernorUnexpectedProposalState',
              [this.proposal.id, Enums.ProposalState.Defeated, proposalStatesToBitMap([Enums.ProposalState.Active])],
            );
          });
        });

        describe('on vote by signature', function () {
          beforeEach(async function () {
            this.voterBySig = Wallet.generate();
            this.voterBySig.address = web3.utils.toChecksumAddress(this.voterBySig.getAddressString());

            this.data = (contract, message) =>
              getDomain(contract).then(domain => ({
                primaryType: 'Ballot',
                types: {
                  EIP712Domain: domainType(domain),
                  Ballot: [
                    { name: 'proposalId', type: 'uint256' },
                    { name: 'support', type: 'uint8' },
                    { name: 'voter', type: 'address' },
                    { name: 'nonce', type: 'uint256' },
                  ],
                },
                domain,
                message,
              }));

            this.signature = (contract, message) =>
              this.data(contract, message).then(data =>
                ethSigUtil.signTypedMessage(this.voterBySig.getPrivateKey(), { data }),
              );

            await this.token.delegate(this.voterBySig.address, { from: voter1 });

            // Run proposal
            await this.helper.propose();
            await this.helper.waitForSnapshot();
          });

          it('if signature does not match signer', async function () {
            const nonce = await this.mock.nonces(this.voterBySig.address);

            const voteParams = {
              support: Enums.VoteType.For,
              voter: this.voterBySig.address,
              nonce,
              signature: async (...params) => {
                const sig = await this.signature(...params);
                const tamperedSig = web3.utils.hexToBytes(sig);
                tamperedSig[42] ^= 0xff;
                return web3.utils.bytesToHex(tamperedSig);
              },
            };

            await expectRevertCustomError(this.helper.vote(voteParams), 'GovernorInvalidSignature', [voteParams.voter]);
          });

          it('if vote nonce is incorrect', async function () {
            const nonce = await this.mock.nonces(this.voterBySig.address);

            const voteParams = {
              support: Enums.VoteType.For,
              voter: this.voterBySig.address,
              nonce: nonce.addn(1),
              signature: this.signature,
            };

            await expectRevertCustomError(
              this.helper.vote(voteParams),
              // The signature check implies the nonce can't be tampered without changing the signer
              'GovernorInvalidSignature',
              [voteParams.voter],
            );
          });
        });

        describe('on queue', function () {
          it('always', async function () {
            await this.helper.propose({ from: proposer });
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await expectRevertCustomError(this.helper.queue(), 'GovernorQueueNotImplemented', []);
          });
        });

        describe('on execute', function () {
          it('if proposal does not exist', async function () {
            await expectRevertCustomError(this.helper.execute(), 'GovernorNonexistentProposal', [this.proposal.id]);
          });

          it('if quorum is not reached', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter3 });
            await expectRevertCustomError(this.helper.execute(), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Active,
              proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
            ]);
          });

          it('if score not reached', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.Against }, { from: voter1 });
            await expectRevertCustomError(this.helper.execute(), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Active,
              proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
            ]);
          });

          it('if voting is not over', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await expectRevertCustomError(this.helper.execute(), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Active,
              proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
            ]);
          });

          it('if receiver revert without reason', async function () {
            this.helper.setProposal(
              [
                {
                  target: this.receiver.address,
                  data: this.receiver.contract.methods.mockFunctionRevertsNoReason().encodeABI(),
                },
              ],
              '<proposal description>',
            );

            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await expectRevertCustomError(this.helper.execute(), 'FailedInnerCall', []);
          });

          it('if receiver revert with reason', async function () {
            this.helper.setProposal(
              [
                {
                  target: this.receiver.address,
                  data: this.receiver.contract.methods.mockFunctionRevertsReason().encodeABI(),
                },
              ],
              '<proposal description>',
            );

            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await expectRevert(this.helper.execute(), 'CallReceiverMock: reverting');
          });

          it('if proposal was already executed', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.execute();
            await expectRevertCustomError(this.helper.execute(), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Executed,
              proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
            ]);
          });
        });
      });

      describe('state', function () {
        it('Unset', async function () {
          await expectRevertCustomError(this.mock.state(this.proposal.id), 'GovernorNonexistentProposal', [
            this.proposal.id,
          ]);
        });

        it('Pending & Active', async function () {
          await this.helper.propose();
          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Pending);
          await this.helper.waitForSnapshot();
          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Pending);
          await this.helper.waitForSnapshot(+1);
          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Active);
        });

        it('Defeated', async function () {
          await this.helper.propose();
          await this.helper.waitForDeadline();
          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Active);
          await this.helper.waitForDeadline(+1);
          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Defeated);
        });

        it('Succeeded', async function () {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();
          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Active);
          await this.helper.waitForDeadline(+1);
          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Succeeded);
        });

        it('Executed', async function () {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();
          await this.helper.execute();
          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Executed);
        });
      });

      describe('cancel', function () {
        describe('internal', function () {
          it('before proposal', async function () {
            await expectRevertCustomError(this.helper.cancel('internal'), 'GovernorNonexistentProposal', [
              this.proposal.id,
            ]);
          });

          it('after proposal', async function () {
            await this.helper.propose();

            await this.helper.cancel('internal');
            expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

            await this.helper.waitForSnapshot();
            await expectRevertCustomError(
              this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 }),
              'GovernorUnexpectedProposalState',
              [this.proposal.id, Enums.ProposalState.Canceled, proposalStatesToBitMap([Enums.ProposalState.Active])],
            );
          });

          it('after vote', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });

            await this.helper.cancel('internal');
            expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

            await this.helper.waitForDeadline();
            await expectRevertCustomError(this.helper.execute(), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Canceled,
              proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
            ]);
          });

          it('after deadline', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();

            await this.helper.cancel('internal');
            expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

            await expectRevertCustomError(this.helper.execute(), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Canceled,
              proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
            ]);
          });

          it('after execution', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.execute();

            await expectRevertCustomError(this.helper.cancel('internal'), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Executed,
              proposalStatesToBitMap(
                [Enums.ProposalState.Canceled, Enums.ProposalState.Expired, Enums.ProposalState.Executed],
                { inverted: true },
              ),
            ]);
          });
        });

        describe('public', function () {
          it('before proposal', async function () {
            await expectRevertCustomError(this.helper.cancel('external'), 'GovernorNonexistentProposal', [
              this.proposal.id,
            ]);
          });

          it('after proposal', async function () {
            await this.helper.propose();

            await this.helper.cancel('external');
          });

          it('after proposal - restricted to proposer', async function () {
            await this.helper.propose();

            await expectRevertCustomError(this.helper.cancel('external', { from: owner }), 'GovernorOnlyProposer', [
              owner,
            ]);
          });

          it('after vote started', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot(1); // snapshot + 1 block

            await expectRevertCustomError(this.helper.cancel('external'), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Active,
              proposalStatesToBitMap([Enums.ProposalState.Pending]),
            ]);
          });

          it('after vote', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });

            await expectRevertCustomError(this.helper.cancel('external'), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Active,
              proposalStatesToBitMap([Enums.ProposalState.Pending]),
            ]);
          });

          it('after deadline', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();

            await expectRevertCustomError(this.helper.cancel('external'), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Succeeded,
              proposalStatesToBitMap([Enums.ProposalState.Pending]),
            ]);
          });

          it('after execution', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.execute();

            await expectRevertCustomError(this.helper.cancel('external'), 'GovernorUnexpectedProposalState', [
              this.proposal.id,
              Enums.ProposalState.Executed,
              proposalStatesToBitMap([Enums.ProposalState.Pending]),
            ]);
          });
        });
      });

      describe('proposal length', function () {
        it('empty', async function () {
          this.helper.setProposal([], '<proposal description>');
          await expectRevertCustomError(this.helper.propose(), 'GovernorInvalidProposalLength', [0, 0, 0]);
        });

        it('mismatch #1', async function () {
          this.helper.setProposal(
            {
              targets: [],
              values: [web3.utils.toWei('0')],
              data: [this.receiver.contract.methods.mockFunction().encodeABI()],
            },
            '<proposal description>',
          );
          await expectRevertCustomError(this.helper.propose(), 'GovernorInvalidProposalLength', [0, 1, 1]);
        });

        it('mismatch #2', async function () {
          this.helper.setProposal(
            {
              targets: [this.receiver.address],
              values: [],
              data: [this.receiver.contract.methods.mockFunction().encodeABI()],
            },
            '<proposal description>',
          );
          await expectRevertCustomError(this.helper.propose(), 'GovernorInvalidProposalLength', [1, 1, 0]);
        });

        it('mismatch #3', async function () {
          this.helper.setProposal(
            {
              targets: [this.receiver.address],
              values: [web3.utils.toWei('0')],
              data: [],
            },
            '<proposal description>',
          );
          await expectRevertCustomError(this.helper.propose(), 'GovernorInvalidProposalLength', [1, 0, 1]);
        });
      });

      describe('frontrun protection using description suffix', function () {
        describe('without protection', function () {
          describe('without suffix', function () {
            it('proposer can propose', async function () {
              expectEvent(await this.helper.propose({ from: proposer }), 'ProposalCreated');
            });

            it('someone else can propose', async function () {
              expectEvent(await this.helper.propose({ from: voter1 }), 'ProposalCreated');
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
