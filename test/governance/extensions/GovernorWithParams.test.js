const { expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;
const { fromRpcSig } = require('ethereumjs-util');
const Enums = require('../../helpers/enums');
const { getDomain, domainType } = require('../../helpers/eip712');
const { GovernorHelper } = require('../../helpers/governance');

const Governor = artifacts.require('$GovernorWithParamsMock');
const CallReceiver = artifacts.require('CallReceiverMock');

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
        this.token = await Token.new(tokenName, tokenSymbol, tokenName);
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

      it('Voting with params by signature is properly supported', async function () {
        const voterBySig = Wallet.generate();
        const voterBySigAddress = web3.utils.toChecksumAddress(voterBySig.getAddressString());

        const signature = (contract, message) =>
          getDomain(contract)
            .then(domain => ({
              primaryType: 'ExtendedBallot',
              types: {
                EIP712Domain: domainType(domain),
                ExtendedBallot: [
                  { name: 'proposalId', type: 'uint256' },
                  { name: 'support', type: 'uint8' },
                  { name: 'reason', type: 'string' },
                  { name: 'params', type: 'bytes' },
                ],
              },
              domain,
              message,
            }))
            .then(data => ethSigUtil.signTypedMessage(voterBySig.getPrivateKey(), { data }))
            .then(fromRpcSig);

        await this.token.delegate(voterBySigAddress, { from: voter2 });

        // Run proposal
        await this.helper.propose();
        await this.helper.waitForSnapshot();

        const weight = web3.utils.toBN(web3.utils.toWei('7')).sub(rawParams.uintParam);

        const tx = await this.helper.vote({
          support: Enums.VoteType.For,
          reason: 'no particular reason',
          params: encodedParams,
          signature,
        });

        expectEvent(tx, 'CountParams', { ...rawParams });
        expectEvent(tx, 'VoteCastWithParams', {
          voter: voterBySigAddress,
          proposalId: this.proposal.id,
          support: Enums.VoteType.For,
          weight,
          reason: 'no particular reason',
          params: encodedParams,
        });

        const votes = await this.mock.proposalVotes(this.proposal.id);
        expect(votes.forVotes).to.be.bignumber.equal(weight);
      });
    });
  }
});
