const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { GovernorHelper } = require('../../helpers/governance');
const { VoteType } = require('../../helpers/enums');
const { getDomain, ExtendedBallot } = require('../../helpers/eip712');

const TOKENS = [
  { Token: '$ERC20Votes', mode: 'blocknumber' },
  { Token: '$ERC20VotesTimestampMock', mode: 'timestamp' },
];
const name = 'OZ-Governor';
const version = '1';
const tokenName = 'MockToken';
const tokenSymbol = 'MTKN';
const tokenSupply = ethers.parseEther('100');
const votingDelay = 4n;
const votingPeriod = 16n;
const value = ethers.parseEther('1');
const params = {
  decoded: [42n, 'These are my params'],
  encoded: ethers.AbiCoder.defaultAbiCoder().encode(['uint256', 'string'], [42n, 'These are my params']),
};

describe('GovernorWithParams', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [owner, proposer, voter1, voter2, voter3, voter4, other] = await ethers.getSigners();
      const receiver = await ethers.deployContract('CallReceiverMock');
      const token = await ethers.deployContract(Token, [tokenName, tokenSymbol, version]);
      const mock = await ethers.deployContract('$GovernorWithParamsMock', [name, token]);
      await owner.sendTransaction({ to: mock, value });
      await token.$_mint(owner, tokenSupply);
      const helper = new GovernorHelper(mock, mode);
      await helper.connect(owner).delegate({ token, to: voter1, value: ethers.parseEther('10') });
      await helper.connect(owner).delegate({ token, to: voter2, value: ethers.parseEther('7') });
      await helper.connect(owner).delegate({ token, to: voter3, value: ethers.parseEther('5') });
      await helper.connect(owner).delegate({ token, to: voter4, value: ethers.parseEther('2') });
      return { owner, proposer, voter1, voter2, voter3, voter4, other, receiver, token, mock, helper };
    };

    describe(`using ${Token}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
        // default proposal using consistent address accessor (.target for contracts)
        this.proposal = this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              value,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
            },
          ],
          '<proposal description>',
        );
      });

      it('deployment check', async function () {
        // Ensure consistent address comparison using .address where applicable
        expect(await this.mock.name()).to.equal(name);
        expect(await this.mock.token()).to.equal(this.token);
        expect(await this.mock.votingDelay()).to.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.equal(votingPeriod);
      });

      it('nominal is unaffected', async function () {
        await this.helper.connect(this.proposer).propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: VoteType.For, reason: 'This is nice' });
        await this.helper.connect(this.voter2).vote({ support: VoteType.For });
        await this.helper.connect(this.voter3).vote({ support: VoteType.Against });
        await this.helper.connect(this.voter4).vote({ support: VoteType.Abstain });
        await this.helper.waitForDeadline();
        await this.helper.execute();
        expect(await this.mock.hasVoted(this.proposal.id, this.owner)).to.be.false;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter1)).to.be.true;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter2)).to.be.true;
        expect(await ethers.provider.getBalance(this.mock)).to.equal(0n);
        expect(await ethers.provider.getBalance(this.receiver)).to.equal(value);
      });

      it('Voting with params is properly supported', async function () {
        await this.helper.connect(this.proposer).propose();
        await this.helper.waitForSnapshot();
        const weight = ethers.parseEther('7') - params.decoded[0];
        await expect(
          this.helper.connect(this.voter2).vote({
            support: VoteType.For,
            reason: 'no particular reason',
            params: params.encoded,
          }),
        )
          .to.emit(this.mock, 'CountParams')
          .withArgs(...params.decoded)
          .to.emit(this.mock, 'VoteCastWithParams')
          .withArgs(
            this.voter2.address,
            this.proposal.id,
            VoteType.For,
            weight,
            'no particular reason',
            params.encoded,
          );
        expect(await this.mock.proposalVotes(this.proposal.id)).to.deep.equal([0n, weight, 0n]);
      });

      describe('voting by signature', function () {
        // Helper function for signing votes (reduces duplicate code)
        const signVote = async (signer, contract, message) => {
          const domain = await getDomain(contract);
          return signer.signTypedData(domain, { ExtendedBallot }, message);
        };

        it('supports EOA signatures', async function () {
          await this.token.connect(this.voter2).delegate(this.other);
          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          // Prepare vote
          const weight = ethers.parseEther('7') - params.decoded[0];
          const nonce = await this.mock.nonces(this.other);
          const data = {
            proposalId: this.proposal.id,
            support: VoteType.For,
            voter: this.other.address,
            nonce,
            reason: 'no particular reason',
            params: params.encoded,
            signature: (contract, message) => signVote(this.other, contract, message),
          };
          // Vote and assert events
          await expect(this.helper.vote(data))
            .to.emit(this.mock, 'CountParams')
            .withArgs(...params.decoded)
            .to.emit(this.mock, 'VoteCastWithParams')
            .withArgs(data.voter, data.proposalId, data.support, weight, data.reason, data.params);
          expect(await this.mock.proposalVotes(this.proposal.id)).to.deep.equal([0n, weight, 0n]);
          expect(await this.mock.nonces(this.other)).to.equal(nonce + 1n);
        });

        it('supports EIP-1271 signature signatures', async function () {
          const wallet = await ethers.deployContract('ERC1271WalletMock', [this.other]);
          await this.token.connect(this.voter2).delegate(wallet);
          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          // Prepare vote
          const weight = ethers.parseEther('7') - params.decoded[0];
          const nonce = await this.mock.nonces(this.other);
          const data = {
            proposalId: this.proposal.id,
            support: VoteType.For,
            voter: wallet.target,
            nonce,
            reason: 'no particular reason',
            params: params.encoded,
            signature: (contract, message) => signVote(this.other, contract, message),
          };
          // Vote and assert events
          await expect(this.helper.vote(data))
            .to.emit(this.mock, 'CountParams')
            .withArgs(...params.decoded)
            .to.emit(this.mock, 'VoteCastWithParams')
            .withArgs(data.voter, data.proposalId, data.support, weight, data.reason, data.params);
          expect(await this.mock.proposalVotes(this.proposal.id)).to.deep.equal([0n, weight, 0n]);
          expect(await this.mock.nonces(wallet)).to.equal(nonce + 1n);
        });

        it('reverts if signature does not match signer', async function () {
          await this.token.connect(this.voter2).delegate(this.other);
          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          // Prepare vote with tampered signature
          const nonce = await this.mock.nonces(this.other);
          const data = {
            proposalId: this.proposal.id,
            support: VoteType.For,
            voter: this.other.address,
            nonce,
            reason: 'no particular reason',
            params: params.encoded,
            signature: async (contract, message) => {
              const originalSig = await signVote(this.other, contract, message);
              const tamperedSigArr = ethers.toBeArray(originalSig);
              // Tamper with the signature by flipping one byte
              tamperedSigArr[42] ^= 0xff;
              return ethers.hexlify(tamperedSigArr);
            },
          };
          // Expect revert due to invalid signature
          await expect(this.helper.vote(data))
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidSignature')
            .withArgs(data.voter);
        });

        it('reverts if vote nonce is incorrect', async function () {
          await this.token.connect(this.voter2).delegate(this.other);
          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          // Prepare vote with incorrect nonce
          const nonce = await this.mock.nonces(this.other);
          const data = {
            proposalId: this.proposal.id,
            support: VoteType.For,
            voter: this.other.address,
            nonce: nonce + 1n,
            reason: 'no particular reason',
            params: params.encoded,
            signature: (contract, message) => signVote(this.other, contract, message),
          };
          // Expect revert due to nonce mismatch
          await expect(this.helper.vote(data))
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidSignature')
            .withArgs(data.voter);
        });

        // New test for empty params
        it('reverts when voting with empty params', async function () {
          await this.helper.connect(this.proposer).propose();
          await this.helper.waitForSnapshot();
          await expect(
            this.helper.connect(this.voter2).vote({
              support: VoteType.For,
              reason: 'Empty params test',
              params: '0x',
            }),
          ).to.be.revertedWithCustomError(this.mock, 'GovernorInvalidParams');
        });

        // New test for multiple sequential signature votes
        it('handles multiple sequential signature votes correctly', async function () {
          await this.token.connect(this.voter2).delegate(this.other);
          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          const weight = ethers.parseEther('7') - params.decoded[0];
          const nonce1 = await this.mock.nonces(this.other);
          const data1 = {
            proposalId: this.proposal.id,
            support: VoteType.For,
            voter: this.other.address,
            nonce: nonce1,
            reason: 'first vote',
            params: params.encoded,
            signature: (contract, message) => signVote(this.other, contract, message),
          };
          // First vote should succeed
          await expect(this.helper.vote(data1))
            .to.emit(this.mock, 'CountParams')
            .withArgs(...params.decoded)
            .to.emit(this.mock, 'VoteCastWithParams')
            .withArgs(data1.voter, data1.proposalId, data1.support, weight, data1.reason, data1.params);
  
          // Second vote with the same nonce should revert
          const data2 = {
            proposalId: this.proposal.id,
            support: VoteType.For,
            voter: this.other.address,
            nonce: nonce1, // reuse nonce intentionally
            reason: 'second vote',
            params: params.encoded,
            signature: (contract, message) => signVote(this.other, contract, message),
          };
          await expect(this.helper.vote(data2))
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidSignature')
            .withArgs(data2.voter);
        });
      });
    });
  }
});
