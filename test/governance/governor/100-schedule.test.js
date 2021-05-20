const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const Token = artifacts.require('ERC20VotesMock');
const Governance = artifacts.require('GovernanceMock');
const CallReceiver = artifacts.require('CallReceiverMock');

contract('Governance - schedule', function (accounts) {
  const [ voter ] = accounts;

  const name = 'OZ-Governance';
  const version = '0.0.1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');

  beforeEach(async () => {
    this.token = await Token.new(tokenName, tokenSymbol, voter, tokenSupply);
    this.governance = await Governance.new(name, version, this.token.address);
    this.receiver = await CallReceiver.new();
    await this.token.delegate(voter, { from: voter });
  });

  describe('schedule', () => {
    it('valid proposal', async () => {
      const proposal = [
        [ this.receiver.address ],
        [ new BN('0') ],
        [ this.receiver.contract.methods.mockFunction().encodeABI() ],
        web3.utils.randomHex(32),
      ];
      const proposalId = await this.governance.hashProposal(...proposal);
      const { receipt } = await this.governance.propose(...proposal, '<proposal description>');
      expectEvent(receipt, 'ProposalCreated', { proposalId });
    });

    it('invalid proposal', async () => {
      const proposal = [
        [ this.receiver.address, this.receiver.address ],
        [ new BN('0') ],
        [ this.receiver.contract.methods.mockFunction().encodeABI() ],
        web3.utils.randomHex(32),
      ];
      await expectRevert(
        this.governance.propose(...proposal, '<proposal description>'),
        'Governance: invalid proposal length',
      );
    });

    it('empty proposal', async () => {
      const proposal = [
        [],
        [],
        [],
        web3.utils.randomHex(32),
      ];
      await expectRevert(
        this.governance.propose(...proposal, ''),
        'Governance: empty proposal',
      );
    });
  });
});
