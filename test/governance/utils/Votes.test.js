const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { sum } = require('../../helpers/math');
const { zip } = require('../../helpers/iterate');
const time = require('../../helpers/time');

const { shouldBehaveLikeVotes } = require('./Votes.behavior');

const MODES = {
  blocknumber: '$VotesMock',
  timestamp: '$VotesTimestampMock',
};

const AMOUNTS = [ethers.parseEther('10000000'), 10n, 20n];

// New test settings for mass delegation
const MASS_DELEGATION_ACCOUNTS_COUNT = 100;

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
        Object.assign(this, await loadFixture(fixture));
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

        // New test: mass delegation with 100 accounts
        describe('mass delegation operations', function () {
          beforeEach(async function () {
            this.massAccounts = this.accounts.slice(0, MASS_DELEGATION_ACCOUNTS_COUNT);
            this.massDelegationAmounts = Object.fromEntries(
              this.massAccounts.map(({ address }, index) => [address, BigInt(index + 1) * 1000n])
            );
            this.txs = [];

            for (const [account, amount] of Object.entries(this.massDelegationAmounts)) {
              this.txs.push(await this.votes.$_mint(account, amount));
            }
          });

          it('delegates for mass accounts', async function () {
            for (let i = 0; i < this.massAccounts.length; i++) {
              const delegateAccount = this.massAccounts[i];
              await this.votes.delegate(delegateAccount.address, ethers.Typed.address(delegateAccount.address));
              const votes = await this.votes.getVotes(delegateAccount.address);
              expect(votes).to.equal(this.massDelegationAmounts[delegateAccount.address]);
            }
          });

          it('calculates gas cost for mass delegations', async function () {
            const gasCosts = [];
            for (let i = 0; i < this.massAccounts.length; i++) {
              const delegateAccount = this.massAccounts[i];
              const tx = await this.votes.delegate(delegateAccount.address, ethers.Typed.address(delegateAccount.address));
              const receipt = await tx.wait();
              gasCosts.push(receipt.gasUsed);
            }

            const totalGas = gasCosts.reduce((a, b) => a.add(b), ethers.BigNumber.from(0));
            console.log('Total gas used for mass delegation:', totalGas.toString());
          });
        });
      });
    });
  }
});
