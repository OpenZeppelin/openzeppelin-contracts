const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, mine } = require('@nomicfoundation/hardhat-network-helpers');

const time = require('../../../helpers/time');

const { shouldBehaveLikeVotes } = require('../../../governance/utils/Votes.behavior');

const TOKENS = [
  { Token: '$ERC721Votes', mode: 'blocknumber' },
  // no timestamp mode for ERC721Votes yet
];

const name = 'My Vote';
const symbol = 'MTKN';
const version = '1';
const tokens = [ethers.parseEther('10000000'), 10n, 20n, 30n];

describe('ERC721Votes', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      // accounts is required by shouldBehaveLikeVotes
      const accounts = await ethers.getSigners();
      const [holder, recipient, other1, other2] = accounts;

      const token = await ethers.deployContract(Token, [name, symbol, name, version]);

      return { accounts, holder, recipient, other1, other2, token };
    };

    describe(`vote with ${mode}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
        this.votes = this.token;
      });

      // includes ERC6372 behavior check
      shouldBehaveLikeVotes(tokens, { mode, fungible: false });

      describe('balanceOf', function () {
        beforeEach(async function () {
          await this.votes.$_mint(this.holder, tokens[0]);
          await this.votes.$_mint(this.holder, tokens[1]);
          await this.votes.$_mint(this.holder, tokens[2]);
          await this.votes.$_mint(this.holder, tokens[3]);
        });

        it('grants to initial account', async function () {
          expect(await this.votes.balanceOf(this.holder)).to.equal(4n);
        });
      });

      describe('transfers', function () {
        beforeEach(async function () {
          await this.votes.$_mint(this.holder, tokens[0]);
        });

        it('no delegation', async function () {
          await expect(this.votes.connect(this.holder).transferFrom(this.holder, this.recipient, tokens[0]))
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, tokens[0])
            .to.not.emit(this.token, 'DelegateVotesChanged');

          this.holderVotes = 0n;
          this.recipientVotes = 0n;
        });

        it('sender delegation', async function () {
          await this.votes.connect(this.holder).delegate(this.holder);

          const tx = await this.votes.connect(this.holder).transferFrom(this.holder, this.recipient, tokens[0]);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, tokens[0])
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.holder, 1n, 0n);

          const { logs } = await tx.wait();
          const { index } = logs.find(event => event.fragment.name == 'DelegateVotesChanged');
          for (const event of logs.filter(event => event.fragment.name == 'Transfer')) {
            expect(event.index).to.lt(index);
          }

          this.holderVotes = 0n;
          this.recipientVotes = 0n;
        });

        it('receiver delegation', async function () {
          await this.votes.connect(this.recipient).delegate(this.recipient);

          const tx = await this.votes.connect(this.holder).transferFrom(this.holder, this.recipient, tokens[0]);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, tokens[0])
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.recipient, 0n, 1n);

          const { logs } = await tx.wait();
          const { index } = logs.find(event => event.fragment.name == 'DelegateVotesChanged');
          for (const event of logs.filter(event => event.fragment.name == 'Transfer')) {
            expect(event.index).to.lt(index);
          }

          this.holderVotes = 0n;
          this.recipientVotes = 1n;
        });

        it('full delegation', async function () {
          await this.votes.connect(this.holder).delegate(this.holder);
          await this.votes.connect(this.recipient).delegate(this.recipient);

          const tx = await this.votes.connect(this.holder).transferFrom(this.holder, this.recipient, tokens[0]);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, tokens[0])
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.holder, 1n, 0n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.recipient, 0n, 1n);

          const { logs } = await tx.wait();
          const { index } = logs.find(event => event.fragment.name == 'DelegateVotesChanged');
          for (const event of logs.filter(event => event.fragment.name == 'Transfer')) {
            expect(event.index).to.lt(index);
          }

          this.holderVotes = 0;
          this.recipientVotes = 1n;
        });

        it('returns the same total supply on transfers', async function () {
          await this.votes.connect(this.holder).delegate(this.holder);

          const tx = await this.votes.connect(this.holder).transferFrom(this.holder, this.recipient, tokens[0]);
          const timepoint = await time.clockFromReceipt[mode](tx);

          await mine(2);

          expect(await this.votes.getPastTotalSupply(timepoint - 1n)).to.equal(1n);
          expect(await this.votes.getPastTotalSupply(timepoint + 1n)).to.equal(1n);

          this.holderVotes = 0n;
          this.recipientVotes = 0n;
        });

        it('generally returns the voting balance at the appropriate checkpoint', async function () {
          await this.votes.$_mint(this.holder, tokens[1]);
          await this.votes.$_mint(this.holder, tokens[2]);
          await this.votes.$_mint(this.holder, tokens[3]);

          const total = await this.votes.balanceOf(this.holder);

          const t1 = await this.votes.connect(this.holder).delegate(this.other1);
          await mine(2);
          const t2 = await this.votes.connect(this.holder).transferFrom(this.holder, this.other2, tokens[0]);
          await mine(2);
          const t3 = await this.votes.connect(this.holder).transferFrom(this.holder, this.other2, tokens[2]);
          await mine(2);
          const t4 = await this.votes.connect(this.other2).transferFrom(this.other2, this.holder, tokens[2]);
          await mine(2);

          t1.timepoint = await time.clockFromReceipt[mode](t1);
          t2.timepoint = await time.clockFromReceipt[mode](t2);
          t3.timepoint = await time.clockFromReceipt[mode](t3);
          t4.timepoint = await time.clockFromReceipt[mode](t4);

          expect(await this.votes.getPastVotes(this.other1, t1.timepoint - 1n)).to.equal(0n);
          expect(await this.votes.getPastVotes(this.other1, t1.timepoint)).to.equal(total);
          expect(await this.votes.getPastVotes(this.other1, t1.timepoint + 1n)).to.equal(total);
          expect(await this.votes.getPastVotes(this.other1, t2.timepoint)).to.equal(3n);
          expect(await this.votes.getPastVotes(this.other1, t2.timepoint + 1n)).to.equal(3n);
          expect(await this.votes.getPastVotes(this.other1, t3.timepoint)).to.equal(2n);
          expect(await this.votes.getPastVotes(this.other1, t3.timepoint + 1n)).to.equal(2n);
          expect(await this.votes.getPastVotes(this.other1, t4.timepoint)).to.equal('3');
          expect(await this.votes.getPastVotes(this.other1, t4.timepoint + 1n)).to.equal(3n);

          this.holderVotes = 0n;
          this.recipientVotes = 0n;
        });

        afterEach(async function () {
          expect(await this.votes.getVotes(this.holder)).to.equal(this.holderVotes);
          expect(await this.votes.getVotes(this.recipient)).to.equal(this.recipientVotes);

          // need to advance 2 blocks to see the effect of a transfer on "getPastVotes"
          const timepoint = await time.clock[mode]();
          await mine();
          expect(await this.votes.getPastVotes(this.holder, timepoint)).to.equal(this.holderVotes);
          expect(await this.votes.getPastVotes(this.recipient, timepoint)).to.equal(this.recipientVotes);
        });
      });
    });
  }
});
