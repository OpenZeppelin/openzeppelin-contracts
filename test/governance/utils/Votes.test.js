const { constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { clockFromReceipt } = require('../../helpers/time');
const { BNsum } = require('../../helpers/math');
const { expectRevertCustomError } = require('../../helpers/customError');

require('array.prototype.at/auto');

const { shouldBehaveLikeVotes } = require('./Votes.behavior');

const MODES = {
  blocknumber: artifacts.require('$VotesMock'),
  timestamp: artifacts.require('$VotesTimestampMock'),
};

contract('Votes', function (accounts) {
  const [account1, account2, account3] = accounts;
  const amounts = {
    [account1]: web3.utils.toBN('10000000000000000000000000'),
    [account2]: web3.utils.toBN('10'),
    [account3]: web3.utils.toBN('20'),
  };

  const name = 'My Vote';
  const version = '1';

  for (const [mode, artifact] of Object.entries(MODES)) {
    describe(`vote with ${mode}`, function () {
      beforeEach(async function () {
        this.votes = await artifact.new(name, version);
      });

      shouldBehaveLikeVotes(accounts, Object.values(amounts), { mode, fungible: true });

      it('starts with zero votes', async function () {
        expect(await this.votes.getTotalSupply()).to.be.bignumber.equal('0');
      });

      describe('performs voting operations', function () {
        beforeEach(async function () {
          this.txs = [];
          for (const [account, amount] of Object.entries(amounts)) {
            this.txs.push(await this.votes.$_mint(account, amount));
          }
        });

        it('reverts if block number >= current block', async function () {
          const lastTxTimepoint = await clockFromReceipt[mode](this.txs.at(-1).receipt);
          const clock = await this.votes.clock();
          await expectRevertCustomError(this.votes.getPastTotalSupply(lastTxTimepoint + 1), 'ERC5805FutureLookup', [
            lastTxTimepoint + 1,
            clock,
          ]);
        });

        it('delegates', async function () {
          expect(await this.votes.getVotes(account1)).to.be.bignumber.equal('0');
          expect(await this.votes.getVotes(account2)).to.be.bignumber.equal('0');
          expect(await this.votes.delegates(account1)).to.be.equal(constants.ZERO_ADDRESS);
          expect(await this.votes.delegates(account2)).to.be.equal(constants.ZERO_ADDRESS);

          await this.votes.delegate(account1, account1);

          expect(await this.votes.getVotes(account1)).to.be.bignumber.equal(amounts[account1]);
          expect(await this.votes.getVotes(account2)).to.be.bignumber.equal('0');
          expect(await this.votes.delegates(account1)).to.be.equal(account1);
          expect(await this.votes.delegates(account2)).to.be.equal(constants.ZERO_ADDRESS);

          await this.votes.delegate(account2, account1);

          expect(await this.votes.getVotes(account1)).to.be.bignumber.equal(amounts[account1].add(amounts[account2]));
          expect(await this.votes.getVotes(account2)).to.be.bignumber.equal('0');
          expect(await this.votes.delegates(account1)).to.be.equal(account1);
          expect(await this.votes.delegates(account2)).to.be.equal(account1);
        });

        it('cross delegates', async function () {
          await this.votes.delegate(account1, account2);
          await this.votes.delegate(account2, account1);

          expect(await this.votes.getVotes(account1)).to.be.bignumber.equal(amounts[account2]);
          expect(await this.votes.getVotes(account2)).to.be.bignumber.equal(amounts[account1]);
        });

        it('returns total amount of votes', async function () {
          const totalSupply = BNsum(...Object.values(amounts));
          expect(await this.votes.getTotalSupply()).to.be.bignumber.equal(totalSupply);
        });
      });
    });
  }
});
