const { BN, expectEvent, constants, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { shouldBehaveLikeERC721 } = require('../ERC721.behavior');

const ERC721 = artifacts.require('$ERC721');
const ERC721Wrapper = artifacts.require('$ERC721Wrapper');

contract('ERC721Wrapper', function (accounts) {
  const [initialHolder, anotherAccount, approvedAccount] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';
  const firstTokenId = new BN(1);
  const secondTokenId = new BN(2);

  beforeEach(async function () {
    this.underlying = await ERC721.new(name, symbol);
    this.token = await ERC721Wrapper.new(`Wrapped ${name}`, `W${symbol}`, this.underlying.address);

    await this.underlying.$_safeMint(initialHolder, firstTokenId);
    await this.underlying.$_safeMint(initialHolder, secondTokenId);
  });

  it('has a name', async function () {
    expect(await this.token.name()).to.equal(`Wrapped ${name}`);
  });

  it('has a symbol', async function () {
    expect(await this.token.symbol()).to.equal(`W${symbol}`);
  });

  it('has underlying', async function () {
    expect(await this.token.underlying()).to.be.bignumber.equal(this.underlying.address);
  });

  describe('depositFor', function () {
    it('works with token approval', async function () {
      await this.underlying.approve(this.token.address, firstTokenId, { from: initialHolder });

      const { tx } = await this.token.depositFor(initialHolder, [firstTokenId], { from: initialHolder });

      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: initialHolder,
        to: this.token.address,
        tokenId: firstTokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: initialHolder,
        tokenId: firstTokenId,
      });
    });

    it('works with approval for all', async function () {
      await this.underlying.setApprovalForAll(this.token.address, true, { from: initialHolder });

      const { tx } = await this.token.depositFor(initialHolder, [firstTokenId], { from: initialHolder });

      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: initialHolder,
        to: this.token.address,
        tokenId: firstTokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: initialHolder,
        tokenId: firstTokenId,
      });
    });

    it('works sending to another account', async function () {
      await this.underlying.approve(this.token.address, firstTokenId, { from: initialHolder });

      const { tx } = await this.token.depositFor(anotherAccount, [firstTokenId], { from: initialHolder });

      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: initialHolder,
        to: this.token.address,
        tokenId: firstTokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: anotherAccount,
        tokenId: firstTokenId,
      });
    });

    it('works with multiple tokens', async function () {
      await this.underlying.approve(this.token.address, firstTokenId, { from: initialHolder });
      await this.underlying.approve(this.token.address, secondTokenId, { from: initialHolder });

      const { tx } = await this.token.depositFor(initialHolder, [firstTokenId, secondTokenId], { from: initialHolder });

      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: initialHolder,
        to: this.token.address,
        tokenId: firstTokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: initialHolder,
        tokenId: firstTokenId,
      });
      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: initialHolder,
        to: this.token.address,
        tokenId: secondTokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: initialHolder,
        tokenId: secondTokenId,
      });
    });

    it('reverts with missing approval', async function () {
      await expectRevert(
        this.token.depositFor(initialHolder, [firstTokenId], { from: initialHolder }),
        'ERC721: caller is not token owner or approved',
      );
    });
  });

  describe('withdrawTo', function () {
    beforeEach(async function () {
      await this.underlying.approve(this.token.address, firstTokenId, { from: initialHolder });
      await this.token.depositFor(initialHolder, [firstTokenId], { from: initialHolder });
    });

    it('works for an owner', async function () {
      const { tx } = await this.token.withdrawTo(initialHolder, [firstTokenId], { from: initialHolder });

      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: this.token.address,
        to: initialHolder,
        tokenId: firstTokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: initialHolder,
        to: constants.ZERO_ADDRESS,
        tokenId: firstTokenId,
      });
    });

    it('works for an approved', async function () {
      await this.token.approve(approvedAccount, firstTokenId, { from: initialHolder });

      const { tx } = await this.token.withdrawTo(initialHolder, [firstTokenId], { from: approvedAccount });

      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: this.token.address,
        to: initialHolder,
        tokenId: firstTokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: initialHolder,
        to: constants.ZERO_ADDRESS,
        tokenId: firstTokenId,
      });
    });

    it('works for an approved for all', async function () {
      await this.token.setApprovalForAll(approvedAccount, true, { from: initialHolder });

      const { tx } = await this.token.withdrawTo(initialHolder, [firstTokenId], { from: approvedAccount });

      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: this.token.address,
        to: initialHolder,
        tokenId: firstTokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: initialHolder,
        to: constants.ZERO_ADDRESS,
        tokenId: firstTokenId,
      });
    });

    it("doesn't work for a non-owner nor approved", async function () {
      await expectRevert(
        this.token.withdrawTo(initialHolder, [firstTokenId], { from: anotherAccount }),
        'ERC721Wrapper: caller is not token owner or approved',
      );
    });

    it('works with multiple tokens', async function () {
      await this.underlying.approve(this.token.address, secondTokenId, { from: initialHolder });
      await this.token.depositFor(initialHolder, [secondTokenId], { from: initialHolder });

      const { tx } = await this.token.withdrawTo(initialHolder, [firstTokenId, secondTokenId], { from: initialHolder });

      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: this.token.address,
        to: initialHolder,
        tokenId: firstTokenId,
      });
      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: this.token.address,
        to: initialHolder,
        tokenId: secondTokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: initialHolder,
        to: constants.ZERO_ADDRESS,
        tokenId: firstTokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: initialHolder,
        to: constants.ZERO_ADDRESS,
        tokenId: secondTokenId,
      });
    });

    it('works to another account', async function () {
      const { tx } = await this.token.withdrawTo(anotherAccount, [firstTokenId], { from: initialHolder });

      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: this.token.address,
        to: anotherAccount,
        tokenId: firstTokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: initialHolder,
        to: constants.ZERO_ADDRESS,
        tokenId: firstTokenId,
      });
    });
  });

  describe('onERC721Received', function () {
    it('only allows calls from underlying', async function () {
      await expectRevert(
        this.token.onERC721Received(
          initialHolder,
          this.token.address,
          firstTokenId,
          anotherAccount, // Correct data
          { from: anotherAccount },
        ),
        'ERC721Wrapper: caller is not underlying',
      );
    });

    it('mints a token to from', async function () {
      const { tx } = await this.underlying.safeTransferFrom(initialHolder, this.token.address, firstTokenId, {
        from: initialHolder,
      });

      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: initialHolder,
        tokenId: firstTokenId,
      });
    });
  });

  describe('_recover', function () {
    it('works if there is something to recover', async function () {
      // Should use `transferFrom` to avoid `onERC721Received` minting
      await this.underlying.transferFrom(initialHolder, this.token.address, firstTokenId, { from: initialHolder });

      const { tx } = await this.token.$_recover(anotherAccount, firstTokenId);

      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: anotherAccount,
        tokenId: firstTokenId,
      });
    });

    it('reverts if there is nothing to recover', async function () {
      await expectRevert(
        this.token.$_recover(initialHolder, firstTokenId),
        'ERC721Wrapper: wrapper is not token owner',
      );
    });
  });

  describe('ERC712 behavior', function () {
    shouldBehaveLikeERC721('ERC721', ...accounts);
  });
});
