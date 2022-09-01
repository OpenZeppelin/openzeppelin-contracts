const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const ERC721ConsecutiveMock = artifacts.require('ERC721ConsecutiveMock');

contract('ERC721Consecutive', function (accounts) {
  const [ user1, user2, user3, receiver ] = accounts;

  const name = 'Non Fungible Token';
  const symbol = 'NFT';
  const batches = [
    { receiver: user1, amount: 0 },
    { receiver: user1, amount: 3 },
    { receiver: user2, amount: 5 },
    { receiver: user3, amount: 0 },
    { receiver: user1, amount: 7 },
  ];

  beforeEach(async function () {
    this.token = await ERC721ConsecutiveMock.new(
      name,
      symbol,
      batches.map(({ receiver }) => receiver),
      batches.map(({ amount }) => amount),
    );
  });

  describe('minting during construction', function () {
    it('events are emitted at construction', async function () {
      let first = 0;

      for (const batch of batches) {
        if (batch.amount == 0) continue;

        await expectEvent.inTransaction(this.token.transactionHash, this.token, 'ConsecutiveTransfer', {
          fromTokenId: web3.utils.toBN(first),
          toTokenId: web3.utils.toBN(first + batch.amount - 1),
          fromAddress: constants.ZERO_ADDRESS,
          toAddress: batch.receiver,
        });

        first += batch.amount;
      }
    });

    it('ownership is set', async function () {
      const owners = batches.flatMap(({ receiver, amount }) => Array(amount).fill(receiver));

      for (const tokenId in owners) {
        expect(await this.token.ownerOf(tokenId))
          .to.be.equal(owners[tokenId]);
      }
    });

    it('balance & voting power are set', async function () {
      for (const account of accounts) {
        const balance = batches
          .filter(({ receiver }) => receiver === account)
          .map(({ amount }) => amount)
          .reduce((a, b) => a + b, 0);

        expect(await this.token.balanceOf(account))
          .to.be.bignumber.equal(web3.utils.toBN(balance));

        expect(await this.token.getVotes(account))
          .to.be.bignumber.equal(web3.utils.toBN(balance));
      }
    });

    it('enumerability correctly set', async function () {
      const owners = batches.flatMap(({ receiver, amount }) => Array(amount).fill(receiver));

      expect(await this.token.totalSupply())
        .to.be.bignumber.equal(web3.utils.toBN(owners.length));

      for (const tokenId in owners) {
        expect(await this.token.tokenByIndex(tokenId))
          .to.be.bignumber.equal(web3.utils.toBN(tokenId));
      }

      for (const account of accounts) {
        const owned = Object.entries(owners)
          .filter(([ _, owner ]) => owner === account)
          .map(([ tokenId, _ ]) => tokenId);

        for (const i in owned) {
          expect(await this.token.tokenOfOwnerByIndex(account, i).then(x => x.toString()))
            .to.be.bignumber.equal(web3.utils.toBN(owned[i]));
        }
      }
    });
  });

  describe('minting after construction', function () {
    it('consecutive minting is not possible after construction', async function () {
      await expectRevert(
        this.token.mintConsecutive(user1, 10),
        'ERC721Consecutive: batch minting restricted to constructor',
      );
    });

    it('simple minting is possible after construction', async function () {
      const tokenId = batches.reduce((acc, { amount }) => acc + amount, 0) + 1;
      const receipt = await this.token.mint(user1, tokenId);
      expectEvent(receipt, 'Transfer', { from: constants.ZERO_ADDRESS, to: user1, tokenId: tokenId.toString() });
    });
  });

  describe('ERC721 behavior', function () {
    it('core takes over ownership on transfer', async function () {
      await this.token.transferFrom(user1, receiver, 1, { from: user1 });

      expect(await this.token.ownerOf(1)).to.be.equal(receiver);
    });

    it('tokens can be burned and re-minted', async function () {
      const receipt1 = await this.token.burn(1, { from: user1 });
      expectEvent(receipt1, 'Transfer', { from: user1, to: constants.ZERO_ADDRESS, tokenId: '1' });

      await expectRevert(this.token.ownerOf(1), 'ERC721: invalid token ID');

      const receipt2 = await this.token.mint(user2, 1);
      expectEvent(receipt2, 'Transfer', { from: constants.ZERO_ADDRESS, to: user2, tokenId: '1' });

      expect(await this.token.ownerOf(1)).to.be.equal(user2);
    });
  });
});
