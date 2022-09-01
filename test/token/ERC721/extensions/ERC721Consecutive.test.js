const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const ERC721ConsecutiveMock = artifacts.require('ERC721ConsecutiveMock');
const ERC721ConsecutiveNoConstructorMintMock = artifacts.require('ERC721ConsecutiveNoConstructorMintMock');

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
  const delegates = [ user1, user3 ];

  beforeEach(async function () {
    this.token = await ERC721ConsecutiveMock.new(
      name,
      symbol,
      delegates,
      batches.map(({ receiver }) => receiver),
      batches.map(({ amount }) => amount),
    );
  });

  describe('minting during construction', function () {
    it('events are emitted at construction', async function () {
      let first = 0;

      for (const batch of batches) {
        if (batch.amount > 0) {
          // an event is emmited
          await expectEvent.inConstruction(this.token, 'ConsecutiveTransfer', {
            fromTokenId: web3.utils.toBN(first),
            toTokenId: web3.utils.toBN(first + batch.amount - 1),
            fromAddress: constants.ZERO_ADDRESS,
            toAddress: batch.receiver,
          });
        } else {
          // expectEvent.notEmitted.inConstruction only looks at event name, and doesn't check the parameters
        }
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

        // If not delegated at construction, check before + do delegation
        if (!delegates.includes(account)) {
          expect(await this.token.getVotes(account))
            .to.be.bignumber.equal(web3.utils.toBN(0));

          await this.token.delegate(account, { from: account });
        }

        // At this point all accounts should have delegated
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

    it('cannot use single minting during construction', async function () {
      await expectRevert(
        ERC721ConsecutiveNoConstructorMintMock.new(name, symbol),
        'ERC721Consecutive: can\'t mint during construction',
      );
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
      const tokenId = batches.reduce((acc, { amount }) => acc + amount, 0);

      expect(await this.token.exists(tokenId)).to.be.equal(false);

      expectEvent(
        await this.token.mint(user1, tokenId),
        'Transfer',
        { from: constants.ZERO_ADDRESS, to: user1, tokenId: tokenId.toString() },
      );
    });

    it('cannot mint a token that has been batched minted', async function () {
      const tokenId = batches.reduce((acc, { amount }) => acc + amount, 0) - 1;

      expect(await this.token.exists(tokenId)).to.be.equal(true);

      await expectRevert(
        this.token.mint(user1, tokenId),
        'ERC721: token already minted',
      );
    });
  });

  describe('ERC721 behavior', function () {
    it('core takes over ownership on transfer', async function () {
      await this.token.transferFrom(user1, receiver, 1, { from: user1 });

      expect(await this.token.ownerOf(1)).to.be.equal(receiver);
    });

    it('tokens can be burned and re-minted', async function () {
      expectEvent(
        await this.token.burn(1, { from: user1 }),
        'Transfer',
        { from: user1, to: constants.ZERO_ADDRESS, tokenId: '1' },
      );

      await expectRevert(this.token.ownerOf(1), 'ERC721: invalid token ID');

      expectEvent(
        await this.token.mint(user2, 1),
        'Transfer',
        { from: constants.ZERO_ADDRESS, to: user2, tokenId: '1' },
      );

      expect(await this.token.ownerOf(1)).to.be.equal(user2);
    });
  });
});
