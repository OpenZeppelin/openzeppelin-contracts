import assertRevert from '../helpers/assertRevert';

const ProposableMock = artifacts.require('ProposableMock');

contract('ProposableMock', (accounts) => {
  const from = accounts[0];
  const args = [100, 'tokens', accounts[1], 1, 'ETH', accounts[1], '0xdeadbeef'];

  beforeEach(async function () {
    this.proposable = await ProposableMock.new();
  });

  describe('extendProposal', () => {
    it('extend a proposal', async function () {
      const { logs } = await this.proposable.extendProposal(...args, [], { from });
      assert.equal(logs.length, 1);
      assert.equal(logs[0].event, 'ProposalExtended');
      assert.equal(logs[0].args.by, from);
    });

    it('reverts because a proposal with this identifier already exists', async function () {
      await this.proposable.extendProposal(...args, [], { from });
      await assertRevert(this.proposable.extendProposal(...args, [], { from }));
    });

    it('proposals with unique identifiers can be extended', async function () {
      await this.proposable.extendProposal(...args, [], { from });
      await this.proposable.extendProposal(...args, [], { from: accounts[1] });
    });

    it('extends a proposal directed towards a single party', async function () {
      await this.proposable.extendProposal(...args, [accounts[0]], { from });
    });

    it('extends a proposal directed towards multiple parties', async function () {
      await this.proposable.extendProposal(...args, [accounts[0], accounts[2]], { from });
    });
  });

  describe('rescindProposal', () => {
    it('rescinds an open proposal', async function () {
      const r = await this.proposable.extendProposal(...args, [], { from });
      const { logs } = await this.proposable.rescindProposal(r.logs[0].args.proposal, { from });
      assert.equal(logs.length, 1);
      assert.equal(logs[0].event, 'ProposalClosed');
      assert.equal(logs[0].args.proposal, r.logs[0].args.proposal);
    });

    it('reverts because a party tries to rescind a proposal it did not extend', async function () {
      const { logs } = await this.proposable.extendProposal(...args, [], { from });
      await assertRevert(this.proposable.rescindProposal(logs[0].args.proposal, { from: accounts[1] }));
    });

    it('reverts because a party tries to rescind a proposal that is not open', async function () {
      const { logs } = await this.proposable.extendProposal(...args, [], { from });
      await this.proposable.vote(logs[0].args.proposal, true, { from });
      await this.proposable.vote(logs[0].args.proposal, true, { from: accounts[1] });
      await assertRevert(this.proposable.rescindProposal(logs[0].args.proposal, { from }));
    });
  });

  describe('vote', () => {
    it('voteUp', async function () {
      const r = await this.proposable.extendProposal(...args, [], { from });
      await this.proposable.vote(r.logs[0].args.proposal, true, { from });
      const { logs } = await this.proposable.vote(r.logs[0].args.proposal, true, { from: accounts[1] });

      assert.equal(logs.length, 3);
      assert.equal(logs[0].event, 'Voted');
      assert.equal(logs[0].args.proposal, r.logs[0].args.proposal);
      assert.equal(logs[0].args.voter, accounts[1]);
      assert.equal(logs[1].event, 'ProposalAccepted');
      assert.equal(logs[1].args.proposal, r.logs[0].args.proposal);
      assert.equal(logs[2].event, 'ProposalExecuted');
      assert.equal(logs[2].args.proposal, r.logs[0].args.proposal);
    });

    it('voteDown', async function () {
      const r = await this.proposable.extendProposal(...args, [], { from });
      await this.proposable.vote(r.logs[0].args.proposal, false, { from });
      const { logs } = await this.proposable.vote(r.logs[0].args.proposal, false, { from: accounts[1] });

      assert.equal(logs.length, 3);
      assert.equal(logs[0].event, 'Voted');
      assert.equal(logs[0].args.proposal, r.logs[0].args.proposal);
      assert.equal(logs[0].args.voter, accounts[1]);
      assert.equal(logs[1].event, 'ProposalRejected');
      assert.equal(logs[1].args.proposal, r.logs[0].args.proposal);
      assert.equal(logs[2].event, 'ProposalClosed');
      assert.equal(logs[2].args.proposal, r.logs[0].args.proposal);
    });

    it('reverts because a party tries to vote on a proposal that is not open', async function () {
      const { logs } = await this.proposable.extendProposal(...args, [], { from });
      await this.proposable.vote(logs[0].args.proposal, true, { from: accounts[1] });
      await this.proposable.vote(logs[0].args.proposal, true, { from: accounts[2] });
      await assertRevert(this.proposable.vote(logs[0].args.proposal, true, { from }));
    });

    it('a party can vote on a proposal directed towards itself', async function () {
      const { logs } = await this.proposable.extendProposal(...args, [accounts[4]], { from });
      const r = await this.proposable.vote(logs[0].args.proposal, true, { from: accounts[4] });
      assert.equal(r.logs[0].event, 'Voted');
    });

    it('reverts because a party tries to vote on a proposal not directed towards itself', async function () {
      const { logs } = await this.proposable.extendProposal(...args, [accounts[4]], { from });
      await assertRevert(this.proposable.vote(logs[0].args.proposal, true, { from }));
    });

    it('reverts because a party tries to vote on a proposal multiple times', async function () {
      const { logs } = await this.proposable.extendProposal(...args, [], { from });
      await this.proposable.vote(logs[0].args.proposal, true, { from });
      await assertRevert(this.proposable.vote(logs[0].args.proposal, true, { from }));
    });
  });
});
