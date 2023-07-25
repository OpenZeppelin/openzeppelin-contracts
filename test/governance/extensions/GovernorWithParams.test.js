const { expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const Enums = require('../../helpers/enums');
const { getDomain, domainType } = require('../../helpers/eip712');
const { GovernorHelper } = require('../../helpers/governance');
const { expectRevertCustomError } = require('../../helpers/customError');

const Governor = artifacts.require('$GovernorWithParamsMock');
const CallReceiver = artifacts.require('CallReceiverMock');
const ERC1271WalletMock = artifacts.require('ERC1271WalletMock');

const rawParams = {
  uintParam: web3.utils.toBN('42'),
  strParam: 'These are my params',
};

const encodedParams = web3.eth.abi.encodeParameters(['uint256', 'string'], Object.values(rawParams));

const TOKENS = [
  { Token: artifacts.require('$ERC20Votes'), mode: 'blocknumber' },
  { Token: artifacts.require('$ERC20VotesTimestampMock'), mode: 'timestamp' },
];

contract('GovernorWithParams', function (accounts) {
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
        this.token = await Token.new(tokenName, tokenSymbol, tokenName, version);
        this.mock = await Governor.new(name, this.token.address);
        this.receiver = await CallReceiver.new();

        this.helper = new GovernorHelper(this.mock, mode);

        await web3.eth.sendTransaction({ from: owner, to: this.mock.address, value });

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
      });

      it('deployment check', async function () {
        expect(await this.mock.name()).to.be.equal(name);
        expect(await this.mock.token()).to.be.equal(this.token.address);
        expect(await this.mock.votingDelay()).to.be.bignumber.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.be.bignumber.equal(votingPeriod);
      });

      it('nominal is unaffected', async function () {
        await this.helper.propose({ from: proposer });
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For, reason: 'This is nice' }, { from: voter1 });
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter2 });
        await this.helper.vote({ support: Enums.VoteType.Against }, { from: voter3 });
        await this.helper.vote({ support: Enums.VoteType.Abstain }, { from: voter4 });
        await this.helper.waitForDeadline();
        await this.helper.execute();

        expect(await this.mock.hasVoted(this.proposal.id, owner)).to.be.equal(false);
        expect(await this.mock.hasVoted(this.proposal.id, voter1)).to.be.equal(true);
        expect(await this.mock.hasVoted(this.proposal.id, voter2)).to.be.equal(true);
        expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal('0');
        expect(await web3.eth.getBalance(this.receiver.address)).to.be.bignumber.equal(value);
      });

      it('Voting with params is properly supported', async function () {
        await this.helper.propose({ from: proposer });
        await this.helper.waitForSnapshot();

        const weight = web3.utils.toBN(web3.utils.toWei('7')).sub(rawParams.uintParam);

        const tx = await this.helper.vote(
          {
            support: Enums.VoteType.For,
            reason: 'no particular reason',
            params: encodedParams,
          },
          { from: voter2 },
        );

        expectEvent(tx, 'CountParams', { ...rawParams });
        expectEvent(tx, 'VoteCastWithParams', {
          voter: voter2,
          proposalId: this.proposal.id,
          support: Enums.VoteType.For,
          weight,
          reason: 'no particular reason',
          params: encodedParams,
        });

        const votes = await this.mock.proposalVotes(this.proposal.id);
        expect(votes.forVotes).to.be.bignumber.equal(weight);
      });

      describe('voting by signature', function () {
        beforeEach(async function () {
          this.voterBySig = Wallet.generate();
          this.voterBySig.address = web3.utils.toChecksumAddress(this.voterBySig.getAddressString());

          this.data = (contract, message) =>
            getDomain(contract).then(domain => ({
              primaryType: 'ExtendedBallot',
              types: {
                EIP712Domain: domainType(domain),
                ExtendedBallot: [
                  { name: 'proposalId', type: 'uint256' },
                  { name: 'support', type: 'uint8' },
                  { name: 'voter', type: 'address' },
                  { name: 'nonce', type: 'uint256' },
                  { name: 'reason', type: 'string' },
                  { name: 'params', type: 'bytes' },
                ],
              },
              domain,
              message,
            }));

          this.sign = privateKey => async (contract, message) =>
            ethSigUtil.signTypedMessage(privateKey, { data: await this.data(contract, message) });
        });

        it('supports EOA signatures', async function () {
          await this.token.delegate(this.voterBySig.address, { from: voter2 });

          const weight = web3.utils.toBN(web3.utils.toWei('7')).sub(rawParams.uintParam);

          const nonce = await this.mock.nonces(this.voterBySig.address);

          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          const tx = await this.helper.vote({
            support: Enums.VoteType.For,
            voter: this.voterBySig.address,
            nonce,
            reason: 'no particular reason',
            params: encodedParams,
            signature: this.sign(this.voterBySig.getPrivateKey()),
          });

          expectEvent(tx, 'CountParams', { ...rawParams });
          expectEvent(tx, 'VoteCastWithParams', {
            voter: this.voterBySig.address,
            proposalId: this.proposal.id,
            support: Enums.VoteType.For,
            weight,
            reason: 'no particular reason',
            params: encodedParams,
          });

          const votes = await this.mock.proposalVotes(this.proposal.id);
          expect(votes.forVotes).to.be.bignumber.equal(weight);
          expect(await this.mock.nonces(this.voterBySig.address)).to.be.bignumber.equal(nonce.addn(1));
        });

        it('supports EIP-1271 signature signatures', async function () {
          const ERC1271WalletOwner = Wallet.generate();
          ERC1271WalletOwner.address = web3.utils.toChecksumAddress(ERC1271WalletOwner.getAddressString());

          const wallet = await ERC1271WalletMock.new(ERC1271WalletOwner.address);

          await this.token.delegate(wallet.address, { from: voter2 });

          const weight = web3.utils.toBN(web3.utils.toWei('7')).sub(rawParams.uintParam);

          const nonce = await this.mock.nonces(wallet.address);

          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          const tx = await this.helper.vote({
            support: Enums.VoteType.For,
            voter: wallet.address,
            nonce,
            reason: 'no particular reason',
            params: encodedParams,
            signature: this.sign(ERC1271WalletOwner.getPrivateKey()),
          });

          expectEvent(tx, 'CountParams', { ...rawParams });
          expectEvent(tx, 'VoteCastWithParams', {
            voter: wallet.address,
            proposalId: this.proposal.id,
            support: Enums.VoteType.For,
            weight,
            reason: 'no particular reason',
            params: encodedParams,
          });

          const votes = await this.mock.proposalVotes(this.proposal.id);
          expect(votes.forVotes).to.be.bignumber.equal(weight);
          expect(await this.mock.nonces(wallet.address)).to.be.bignumber.equal(nonce.addn(1));
        });

        it('reverts if signature does not match signer', async function () {
          await this.token.delegate(this.voterBySig.address, { from: voter2 });

          const nonce = await this.mock.nonces(this.voterBySig.address);

          const signature = this.sign(this.voterBySig.getPrivateKey());

          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          const voteParams = {
            support: Enums.VoteType.For,
            voter: this.voterBySig.address,
            nonce,
            signature: async (...params) => {
              const sig = await signature(...params);
              const tamperedSig = web3.utils.hexToBytes(sig);
              tamperedSig[42] ^= 0xff;
              return web3.utils.bytesToHex(tamperedSig);
            },
            reason: 'no particular reason',
            params: encodedParams,
          };

          await expectRevertCustomError(this.helper.vote(voteParams), 'GovernorInvalidSignature', [voteParams.voter]);
        });

        it('reverts if vote nonce is incorrect', async function () {
          await this.token.delegate(this.voterBySig.address, { from: voter2 });

          const nonce = await this.mock.nonces(this.voterBySig.address);

          // Run proposal
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          const voteParams = {
            support: Enums.VoteType.For,
            voter: this.voterBySig.address,
            nonce: nonce.addn(1),
            signature: this.sign(this.voterBySig.getPrivateKey()),
            reason: 'no particular reason',
            params: encodedParams,
          };

          await expectRevertCustomError(
            this.helper.vote(voteParams),
            // The signature check implies the nonce can't be tampered without changing the signer
            'GovernorInvalidSignature',
            [voteParams.voter],
          );
        });
      });
    });
  }
});
