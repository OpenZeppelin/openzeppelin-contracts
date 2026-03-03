const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { GovernorHelper } = require('../../helpers/governance');
const { getDomain, Ballot, ExtendedBallot } = require('../../helpers/eip712');
const { VoteType } = require('../../helpers/enums');
const { shouldBehaveLikeNoncesKeyed } = require('../../utils/Nonces.behavior');

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
const signExtendedBallot = account => (contract, message) =>
  getDomain(contract).then(domain => account.signTypedData(domain, { ExtendedBallot }, message));

describe('GovernorNoncesKeyed', function () {
  const fixture = async () => {
    const [owner, proposer, voter1, voter2, voter3, voter4, userEOA] = await ethers.getSigners();
    const receiver = await ethers.deployContract('CallReceiverMock');

    const token = await ethers.deployContract('$ERC20Votes', [tokenName, tokenSymbol, tokenName, version]);
    const mock = await ethers.deployContract('$GovernorNoncesKeyedMock', [
      name, // name
      votingDelay, // initialVotingDelay
      votingPeriod, // initialVotingPeriod
      0n, // initialProposalThreshold
      token, // tokenAddress
      10n, // quorumNumeratorValue
    ]);

    await owner.sendTransaction({ to: mock, value });
    await token.$_mint(owner, tokenSupply);

    const helper = new GovernorHelper(mock, 'blocknumber');
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

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));

    // default proposal
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
    await expect(this.mock.name()).to.eventually.equal(name);
    await expect(this.mock.token()).to.eventually.equal(this.token);
    await expect(this.mock.votingDelay()).to.eventually.equal(votingDelay);
    await expect(this.mock.votingPeriod()).to.eventually.equal(votingPeriod);
  });

  describe('vote with signature', function () {
    for (const nonceType of ['default', 'keyed']) {
      describe(`with ${nonceType} nonce`, function () {
        beforeEach(async function () {
          await this.helper.propose();

          const maskedProposalId = BigInt(this.helper.id) & (2n ** 192n - 1n);

          this.getNonce = address =>
            nonceType === 'default'
              ? this.mock.nonces(address)
              : this.mock['nonces(address,uint192)'](address, maskedProposalId);
        });

        it('votes with an EOA signature', async function () {
          await this.token.connect(this.voter1).delegate(this.userEOA);

          const nonce = await this.getNonce(this.userEOA);

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
          expect(await this.getNonce(this.userEOA)).to.equal(nonce + 1n);
        });

        it('votes with an EOA signature with reason', async function () {
          await this.token.connect(this.voter1).delegate(this.userEOA);

          const nonce = await this.getNonce(this.userEOA);

          await this.helper.waitForSnapshot();
          await expect(
            this.helper.vote({
              support: VoteType.For,
              voter: this.userEOA.address,
              nonce,
              reason: 'This is an example reason',
              signature: signExtendedBallot(this.userEOA),
            }),
          )
            .to.emit(this.mock, 'VoteCast')
            .withArgs(
              this.userEOA,
              this.proposal.id,
              VoteType.For,
              ethers.parseEther('10'),
              'This is an example reason',
            );

          await this.helper.waitForDeadline();
          await this.helper.execute();

          // After
          expect(await this.mock.hasVoted(this.proposal.id, this.userEOA)).to.be.true;
          expect(await this.getNonce(this.userEOA)).to.equal(nonce + 1n);
        });

        it('votes with a valid EIP-1271 signature', async function () {
          const wallet = await ethers.deployContract('ERC1271WalletMock', [this.userEOA]);

          await this.token.connect(this.voter1).delegate(wallet);

          const nonce = await this.getNonce(wallet.target);

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
          expect(await this.getNonce(wallet)).to.equal(nonce + 1n);
        });

        afterEach('no other votes are cast', async function () {
          expect(await this.mock.hasVoted(this.proposal.id, this.owner)).to.be.false;
          expect(await this.mock.hasVoted(this.proposal.id, this.voter1)).to.be.false;
          expect(await this.mock.hasVoted(this.proposal.id, this.voter2)).to.be.false;
        });
      });
    }
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

    for (const nonceType of ['default', 'keyed']) {
      it(`if vote nonce is incorrect with ${nonceType} nonce`, async function () {
        const nonce = await (nonceType === 'default'
          ? this.mock.nonces(this.userEOA)
          : this.mock['nonces(address,uint192)'](this.userEOA, BigInt(this.helper.id) & (2n ** 192n - 1n)));

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
    }
  });

  shouldBehaveLikeNoncesKeyed();
});
