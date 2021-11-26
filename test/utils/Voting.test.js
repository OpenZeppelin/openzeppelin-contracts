const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const VotingImp = artifacts.require('VotingImpl');

contract('Voting', function (accounts) {
  const [ account1, account2, account3 ] = accounts;
  beforeEach(async function () {
    this.voting = await VotingImp.new();
  });

  it('starts with zero votes', async function () {
    expect(await this.voting.getTotalVotes()).to.be.bignumber.equal('0');
  });

  describe('move voting power', function () {
    beforeEach(async function () {
      this.tx1 = await this.voting.mint(account1, 1);
      this.tx2 = await this.voting.mint(account2, 1);
      this.tx3 = await this.voting.mint(account3, 1);
    });

    it('mints', async function () {
      expect(await this.voting.getTotalVotes()).to.be.bignumber.equal('3');

      expect(await this.voting.getTotalVotesAt(this.tx1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
      expect(await this.voting.getTotalVotesAt(this.tx2.receipt.blockNumber - 1)).to.be.bignumber.equal('1');
      expect(await this.voting.getTotalVotesAt(this.tx3.receipt.blockNumber - 1)).to.be.bignumber.equal('2');
    });

    it('reverts if block number >= current block', async function () {
      await expectRevert(
        this.voting.getTotalVotesAt(this.tx3.receipt.blockNumber + 1),
        'block not yet mined',
      );
    });

    it('burns', async function () {
      await this.voting.burn(account1, 1);
      expect(await this.voting.getTotalVotes()).to.be.bignumber.equal('2');

      await this.voting.burn(account2, 1);
      expect(await this.voting.getTotalVotes()).to.be.bignumber.equal('1');

      await this.voting.burn(account3, 1);
      expect(await this.voting.getTotalVotes()).to.be.bignumber.equal('0');
    });

    it('delegates', async function () {
      await this.voting.delegate(account3, account2, 1);

      expect(await this.voting.delegates(account3)).to.be.equal(account2);
    });

    it('transfers', async function () {
      await this.voting.delegate(account1, account2, 1);
      await this.voting.transfer(account1, account2, 1);

      expect(await this.voting.getTotalAccountVotes(account1)).to.be.bignumber.equal('0');
      expect(await this.voting.getTotalAccountVotes(account2)).to.be.bignumber.equal('2');
    });
  });
});
