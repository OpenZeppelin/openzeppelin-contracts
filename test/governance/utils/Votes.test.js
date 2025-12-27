const { ethers, network } = require('hardhat');
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
const MASS_DELEGATION_ACCOUNTS = 120;
const MASS_AMOUNT = ethers.parseEther('1');

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
          expect(await this.votes.getVotes(this.accounts[0].address)).to.equal(0n);
          expect(await this.votes.getVotes(this.accounts[1].address)).to.equal(0n);
          expect(await this.votes.delegates(this.accounts[0].address)).to.equal(ethers.ZeroAddress);
          expect(await this.votes.delegates(this.accounts[1].address)).to.equal(ethers.ZeroAddress);

          await this.votes.connect(this.accounts[0]).delegate(this.accounts[0].address);

          expect(await this.votes.getVotes(this.accounts[0].address))
            .to.equal(this.amounts[this.accounts[0].address]);
          expect(await this.votes.getVotes(this.accounts[1].address)).to.equal(0n);
          expect(await this.votes.delegates(this.accounts[0].address)).to.equal(this.accounts[0].address);
          expect(await this.votes.delegates(this.accounts[1].address)).to.equal(ethers.ZeroAddress);

          await this.votes.connect(this.accounts[1]).delegate(this.accounts[0].address);

          expect(await this.votes.getVotes(this.accounts[0].address)).to.equal(
            this.amounts[this.accounts[0].address] + this.amounts[this.accounts[1].address],
          );
          expect(await this.votes.getVotes(this.accounts[1].address)).to.equal(0n);
          expect(await this.votes.delegates(this.accounts[0].address)).to.equal(this.accounts[0].address);
          expect(await this.votes.delegates(this.accounts[1].address)).to.equal(this.accounts[0].address);
        });

        it('cross delegates', async function () {
          await this.votes.connect(this.accounts[0]).delegate(this.accounts[1].address);
          await this.votes.connect(this.accounts[1]).delegate(this.accounts[0].address);

          expect(await this.votes.getVotes(this.accounts[0].address))
            .to.equal(this.amounts[this.accounts[1].address]);
          expect(await this.votes.getVotes(this.accounts[1].address))
            .to.equal(this.amounts[this.accounts[0].address]);
        });

        it('returns total amount of votes', async function () {
          const totalSupply = sum(...Object.values(this.amounts));
          expect(await this.votes.getTotalSupply()).to.equal(totalSupply);
        });
      });

      //
      // 🆕 Gas Optimization Stress Tests
      //
      describe('gas optimization under mass delegation', function () {
        beforeEach(async function () {
          this.accounts = await ethers.getSigners();
          this.votes = await ethers.deployContract(artifact, ['Mass Vote', '1']);
          // Mint tokens to many accounts
          for (let i = 0; i < MASS_DELEGATION_ACCOUNTS; i++) {
            await this.votes.$_mint(this.accounts[i].address, MASS_AMOUNT);
          }
        });

        it('measures gas for 100+ accounts delegating to a single delegate', async function () {
          const delegateAddr = this.accounts[0].address;
          let totalGas = 0n;

          for (let i = 1; i < MASS_DELEGATION_ACCOUNTS; i++) {
            const tx = await this.votes.connect(this.accounts[i]).delegate(delegateAddr);
            const receipt = await tx.wait();
            totalGas += receipt.gasUsed;
          }

          console.log(`Total gas for ${MASS_DELEGATION_ACCOUNTS - 1} delegations: ${totalGas}`);
        });

        it('measures gas for cross-delegation', async function () {
          let totalGas = 0n;

          for (let i = 0; i < MASS_DELEGATION_ACCOUNTS; i++) {
            const targetAddr = this.accounts[(i + 1) % MASS_DELEGATION_ACCOUNTS].address;
            const tx = await this.votes.connect(this.accounts[i]).delegate(targetAddr);
            const receipt = await tx.wait();
            totalGas += receipt.gasUsed;
          }

          console.log(`Total gas for cross-delegation of ${MASS_DELEGATION_ACCOUNTS} accounts: ${totalGas}`);
        });

        it('handles multiple delegations in the same block', async function () {
          await network.provider.send('evm_setAutomine', [false]);

          for (let i = 1; i <= 50; i++) {
            await this.votes
              .connect(this.accounts[i])
              .delegate(this.accounts[0].address);
          }

          await network.provider.send('evm_mine');
          await network.provider.send('evm_setAutomine', [true]);

          expect(await this.votes.getVotes(this.accounts[0].address))
            .to.equal(MASS_AMOUNT * 51n); // self + 50 delegators
        });
      });
    });
  }
});
