const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, mine } = require('@nomicfoundation/hardhat-network-helpers');

const { zip } = require('../../helpers/iterate');

const { shouldBehaveLikeMultiVotes } = require('./MultiVotes.behavior');

const MODES = {
  blocknumber: '$MultiVotesMock',
  timestamp: '$MultiVotesTimestampMock',
};

const AMOUNTS = [ethers.parseEther('10000000'), 10n, 20n];

describe('MultiVotes', function () {
  for (const [mode, artifact] of Object.entries(MODES)) {
    const fixture = async () => {
      const accounts = await ethers.getSigners();

      const amounts = Object.fromEntries(
        zip(
          accounts.slice(0, AMOUNTS.length).map(({ address }) => address),
          AMOUNTS,
        ),
      );

      const name = 'Multi delegate votes';
      const version = '1';
      const votes = await ethers.deployContract(artifact, [name, version]);

      return { accounts, amounts, votes, name, version };
    };

    describe(`vote with ${mode}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
      });

      shouldBehaveLikeMultiVotes(AMOUNTS, { mode, fungible: true });

      describe('performs critical operations', function () {
        beforeEach(async function () {
          [this.delegator, this.delegatee, this.bob, this.alice, this.other] = this.accounts;
          await mine();
          await this.votes.$_mint(this.delegator, 100);
          await this.votes.$_mint(this.bob, 100);
        });

        it('mints alongside defaulted and partial delegation', async function () {
          await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.bob], [1, 15]);
          await this.votes.connect(this.delegator).delegate(this.delegatee);
          await this.votes.$_mint(this.delegator, 200);

          expect(await this.votes.$_getVotingUnits(this.delegator)).to.equal(300);
          expect(await this.votes.getFreeUnits(this.delegator)).to.equal(284);
          expect(await this.votes.getVotes(this.delegatee)).to.equal(285);
        });

        it('keeps coherent _accountHasDelegate state', async function () {
          await this.votes.connect(this.delegator).multiDelegate([this.delegatee], [1]);
          expect(await this.votes.$_accountHasDelegate(this.delegator, this.delegatee)).to.equal(true);
          expect(await this.votes.$_accountHasDelegate(this.delegator, this.bob)).to.equal(false);

          await this.votes.connect(this.delegator).multiDelegate([this.bob], [15]);
          expect(await this.votes.$_accountHasDelegate(this.delegator, this.bob)).to.equal(true);
          expect(await this.votes.$_accountHasDelegate(this.delegator, this.delegatee)).to.equal(true);

          await this.votes.connect(this.delegator).multiDelegate([this.delegatee], [0]);
          expect(await this.votes.$_accountHasDelegate(this.delegator, this.delegatee)).to.equal(false);
          expect(await this.votes.$_accountHasDelegate(this.delegator, this.bob)).to.equal(true);

          await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.bob], [50, 0]);
          expect(await this.votes.$_accountHasDelegate(this.delegator, this.delegatee)).to.equal(true);
          expect(await this.votes.$_accountHasDelegate(this.delegator, this.bob)).to.equal(false);
        });

        it('keep coherent defaulted delegate state', async function () {
          await this.votes.connect(this.delegator).delegate(this.delegatee);
          await this.votes.connect(this.delegator).delegate(this.delegatee);
          await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.other], [5, 5]);
          await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.other], [5, 5]);
          expect(await this.votes.getVotes(this.delegatee)).to.equal(95);

          await this.votes.connect(this.delegator).multiDelegate([this.delegatee], [0]);
          expect(await this.votes.getVotes(this.delegatee)).to.equal(95);

          await this.votes.connect(this.delegator).multiDelegate([this.bob, this.alice], [20, 10]);
          expect(await this.votes.getVotes(this.delegatee)).to.equal(65);

          await this.votes.connect(this.bob).multiDelegate([this.delegatee], [30]);
          expect(await this.votes.getVotes(this.delegatee)).to.equal(95);

          await this.votes.connect(this.bob).delegate(this.delegatee);
          expect(await this.votes.getVotes(this.delegatee)).to.equal(165);

          await this.votes.connect(this.bob).multiDelegate([this.delegatee], [20]);
          expect(await this.votes.getVotes(this.delegatee)).to.equal(165);

          await this.votes.connect(this.bob).delegate(ethers.ZeroAddress);
          expect(await this.votes.getVotes(this.delegatee)).to.equal(85);

          await this.votes.connect(this.bob).delegate(this.delegatee);
          await this.votes.connect(this.bob).delegate(this.alice);
          expect(await this.votes.getVotes(this.delegatee)).to.equal(85);
          expect(await this.votes.getVotes(this.alice)).to.equal(90);

          await this.votes.connect(this.bob).multiDelegate([this.delegatee], [10]);
          expect(await this.votes.getVotes(this.delegatee)).to.equal(75);

          await this.votes.connect(this.delegator).delegate(this.delegatee);
          await this.votes
            .connect(this.delegator)
            .multiDelegate([this.delegatee, this.alice, this.bob, this.other], [100, 0, 0, 0]);
          expect(await this.votes.getVotes(this.delegatee)).to.equal(110);

          await this.votes
            .connect(this.delegator)
            .multiDelegate([this.delegatee, this.alice, this.bob, this.other], [0, 5, 5, 5]);
          await expect(
            this.votes
              .connect(this.delegator)
              .multiDelegate([this.delegatee, this.alice, this.bob, this.other], [89, 4, 6, 2]),
          )
            .to.be.revertedWithCustomError(this.votes, 'MultiVotesExceededAvailableUnits')
            .withArgs(86, 85);
          await this.votes
            .connect(this.delegator)
            .multiDelegate([this.delegatee, this.alice, this.bob, this.other], [0, 0, 0, 0]);

          await mine();

          await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.alice], [50, 50]);
          await expect(this.votes.connect(this.delegator).multiDelegate([this.alice, this.delegatee], [0, 101]))
            .to.be.revertedWithCustomError(this.votes, 'MultiVotesExceededAvailableUnits')
            .withArgs(1, 0);

          await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.alice], [50, 50]);
          await expect(this.votes.connect(this.delegator).multiDelegate([this.alice, this.delegatee], [3, 98]))
            .to.be.revertedWithCustomError(this.votes, 'MultiVotesExceededAvailableUnits')
            .withArgs(1, 0);
        });
      });
    });
  }
});
