const { contract } = require('hardhat');
const { BN, expectEvent, constants, expectRevert } = require('@openzeppelin/test-helpers');
const ERC721WrapperMock = artifacts.require('ERC721WrapperMock');
const ERC721Mock = artifacts.require('ERC721Mock');
const { shouldBehaveLikeERC721 } = require('../ERC721.behavior');

const { ZERO_ADDRESS } = constants;

contract('ERC721Wrapper', function (accounts) {
  const [initialHolder, anotherAccount] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';
  const tokenId = new BN(1);

  beforeEach(async function () {
    this.underlying = await ERC721Mock.new(name, symbol);
    this.token = await ERC721WrapperMock.new(this.underlying.address, `Wrapped ${name}`, `W${symbol}`);

    await this.underlying.safeMint(initialHolder, tokenId);
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
      await this.underlying.approve(this.token.address, tokenId, { from: initialHolder });
      const { tx } = await this.token.depositFor(initialHolder, tokenId, { from: initialHolder });
      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: initialHolder,
        to: this.token.address,
        tokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: ZERO_ADDRESS,
        to: initialHolder,
        tokenId,
      });
    });

    it('works with approval for all', async function () {
      await this.underlying.setApprovalForAll(this.token.address, true, { from: initialHolder });
      const { tx } = await this.token.depositFor(initialHolder, tokenId, { from: initialHolder });
      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: initialHolder,
        to: this.token.address,
        tokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: ZERO_ADDRESS,
        to: initialHolder,
        tokenId,
      });
    });

    it('works sending to another account', async function () {
      await this.underlying.approve(this.token.address, tokenId, { from: initialHolder });
      const { tx } = await this.token.depositFor(anotherAccount, tokenId, { from: initialHolder });
      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: initialHolder,
        to: this.token.address,
        tokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: ZERO_ADDRESS,
        to: anotherAccount,
        tokenId,
      });
    });

    it('reverts with missing approval', async function () {
      await expectRevert(
        this.token.depositFor(initialHolder, tokenId, { from: initialHolder }),
        'ERC721: caller is not token owner or approved',
      );
    });
  });

  describe('withdrawTo', function () {
    beforeEach(async function () {
      await this.underlying.approve(this.token.address, tokenId, { from: initialHolder });
      await this.token.depositFor(initialHolder, tokenId, { from: initialHolder });
    });

    it('works', async function () {
      const { tx } = await this.token.withdrawTo(initialHolder, tokenId, { from: initialHolder });
      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: this.token.address,
        to: initialHolder,
        tokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: initialHolder,
        to: ZERO_ADDRESS,
        tokenId,
      });
    });

    it('works to another account', async function () {
      const { tx } = await this.token.withdrawTo(anotherAccount, tokenId, { from: initialHolder });
      await expectEvent.inTransaction(tx, this.underlying, 'Transfer', {
        from: this.token.address,
        to: anotherAccount,
        tokenId,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: initialHolder,
        to: ZERO_ADDRESS,
        tokenId,
      });
    });
  });

  describe('_recover', function () {
    it('works if there is something to recover', async function () {
      await this.underlying.safeTransferFrom(initialHolder, this.token.address, tokenId, { from: initialHolder });

      const { tx } = await this.token.recover(anotherAccount, tokenId);
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: ZERO_ADDRESS,
        to: anotherAccount,
        tokenId,
      });
    });

    it('reverts if there is nothing to recover', async function () {
      await expectRevert(this.token.recover(initialHolder, tokenId), 'ERC721Wrapper: wrapper is not token owner');
    });
  });

  describe('ERC712 behavior', function () {
    shouldBehaveLikeERC721('ERC721', ...accounts);
  });
});
