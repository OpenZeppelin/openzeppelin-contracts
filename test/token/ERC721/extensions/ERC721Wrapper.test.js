const { contract } = require('hardhat');
const { BN, expectEvent, constants, expectRevert } = require('@openzeppelin/test-helpers');
const ERC721WrapperMock = artifacts.require('ERC721WrapperMock');
const ERC721Mock = artifacts.require('ERC721Mock');
const { shouldBehaveLikeERC721 } = require('../ERC721.behavior');

const { ZERO_ADDRESS } = constants;

contract('ERC721Wrapper', function (accounts) {
  const [initialHolder, anotherAccount, approvedAccount] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';
  const firstTokenId = new BN(1);
  const secondTokenId = new BN(2);

  beforeEach(async function () {
    this.underlying = await ERC721Mock.new(name, symbol);
    this.token = await ERC721WrapperMock.new(this.underlying.address, `Wrapped ${name}`, `W${symbol}`);

    await this.underlying.safeMint(initialHolder, firstTokenId);
    await this.underlying.safeMint(initialHolder, secondTokenId);
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
        from: ZERO_ADDRESS,
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
        from: ZERO_ADDRESS,
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
        from: ZERO_ADDRESS,
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
        from: ZERO_ADDRESS,
        to: initialHolder,
        tokenId: firstTokenId,
      });
      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: initialHolder,
        to: this.token.address,
        tokenId: secondTokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: ZERO_ADDRESS,
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
        to: ZERO_ADDRESS,
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
        to: ZERO_ADDRESS,
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
        to: ZERO_ADDRESS,
        tokenId: firstTokenId,
      });
    });

    it("doesn't work for a non-owner nor approved", async function () {
      await expectRevert(this.token.withdrawTo(initialHolder, [firstTokenId], { from: anotherAccount }), "ERC721: caller is not token owner or approved");
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
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: initialHolder,
        to: ZERO_ADDRESS,
        tokenId: firstTokenId,
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
        to: ZERO_ADDRESS,
        tokenId: firstTokenId,
      });
    });
  });

  describe('_recover', function () {
    it('works if there is something to recover', async function () {
      await this.underlying.safeTransferFrom(initialHolder, this.token.address, firstTokenId, { from: initialHolder });

      const { tx } = await this.token.recover(anotherAccount, firstTokenId);
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: ZERO_ADDRESS,
        to: anotherAccount,
        tokenId: firstTokenId,
      });
    });

    it('reverts if there is nothing to recover', async function () {
      await expectRevert(this.token.recover(initialHolder, firstTokenId), 'ERC721Wrapper: wrapper is not token owner');
    });
  });

  describe('ERC712 behavior', function () {
    shouldBehaveLikeERC721('ERC721', ...accounts);
  });
});
