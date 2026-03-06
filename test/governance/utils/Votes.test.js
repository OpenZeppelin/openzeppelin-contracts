import { network } from 'hardhat';
import { expect } from 'chai';
import { zip } from '../../helpers/iterate';
import { sum } from '../../helpers/math';
import { shouldBehaveLikeVotes } from './Votes.behavior';

const connection = await network.connect();
const {
  ethers,
  helpers: { time },
  networkHelpers: { loadFixture },
} = connection;

const MODES = {
  blocknumber: '$VotesMock',
  timestamp: '$VotesTimestampMock',
};

const AMOUNTS = [ethers.parseEther('10000000'), 10n, 20n];

describe('Votes', function () {
  for (const [mode, artifact] of Object.entries(MODES)) {
    const fixture = async () => {
      const accounts = await ethers.getSigners();

      const amounts = Object.fromEntries(
        zip(
          accounts.slice(0, AMOUNTS.length).map(({ address }) => address),
          AMOUNTS,
        ),
      );

      const name = 'My Vote';
      const version = '1';
      const votes = await ethers.deployContract(artifact, [name, version]);

      return { accounts, amounts, votes, name, version };
    };

    describe(`vote with ${mode}`, function () {
      beforeEach(async function () {
        Object.assign(this, connection, await loadFixture(fixture));
      });

      shouldBehaveLikeVotes(AMOUNTS, { mode, fungible: true });

      it('starts with zero votes', async function () {
        expect(await this.votes.getTotalSupply()).to.equal(0n);
      });

      describe('performs voting operations', function () {
        beforeEach(async function () {
          this.txs = [];
          for (const [account, amount] of Object.entries(this.amounts)) {
            this.txs.push(await this.votes.$_mint(account, amount));
          }
        });

        it('reverts if block number >= current block', async function () {
          const lastTxTimepoint = await time.clockFromReceipt[mode](this.txs.at(-1));
          const clock = await this.votes.clock();
          await expect(this.votes.getPastTotalSupply(lastTxTimepoint))
            .to.be.revertedWithCustomError(this.votes, 'ERC5805FutureLookup')
            .withArgs(lastTxTimepoint, clock);
        });

        it('delegates', async function () {
          expect(await this.votes.getVotes(this.accounts[0])).to.equal(0n);
          expect(await this.votes.getVotes(this.accounts[1])).to.equal(0n);
          expect(await this.votes.delegates(this.accounts[0])).to.equal(ethers.ZeroAddress);
          expect(await this.votes.delegates(this.accounts[1])).to.equal(ethers.ZeroAddress);

          await this.votes.delegate(this.accounts[0], ethers.Typed.address(this.accounts[0]));

          expect(await this.votes.getVotes(this.accounts[0])).to.equal(this.amounts[this.accounts[0].address]);
          expect(await this.votes.getVotes(this.accounts[1])).to.equal(0n);
          expect(await this.votes.delegates(this.accounts[0])).to.equal(this.accounts[0]);
          expect(await this.votes.delegates(this.accounts[1])).to.equal(ethers.ZeroAddress);

          await this.votes.delegate(this.accounts[1], ethers.Typed.address(this.accounts[0]));

          expect(await this.votes.getVotes(this.accounts[0])).to.equal(
            this.amounts[this.accounts[0].address] + this.amounts[this.accounts[1].address],
          );
          expect(await this.votes.getVotes(this.accounts[1])).to.equal(0n);
          expect(await this.votes.delegates(this.accounts[0])).to.equal(this.accounts[0]);
          expect(await this.votes.delegates(this.accounts[1])).to.equal(this.accounts[0]);
        });

        it('cross delegates', async function () {
          await this.votes.delegate(this.accounts[0], ethers.Typed.address(this.accounts[1]));
          await this.votes.delegate(this.accounts[1], ethers.Typed.address(this.accounts[0]));

          expect(await this.votes.getVotes(this.accounts[0])).to.equal(this.amounts[this.accounts[1].address]);
          expect(await this.votes.getVotes(this.accounts[1])).to.equal(this.amounts[this.accounts[0].address]);
        });

        it('returns total amount of votes', async function () {
          const totalSupply = sum(...Object.values(this.amounts));
          expect(await this.votes.getTotalSupply()).to.equal(totalSupply);
        });
      });
    });
  }
});
