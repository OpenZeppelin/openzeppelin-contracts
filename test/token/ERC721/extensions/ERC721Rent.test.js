const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC721Mock = artifacts.require('ERC721Mock');
const ERC721RentAgreementMock = artifacts.require('ERC721RentAgreementMock');

contract('ERC721Rent', function (accounts) {
  const [owner, renter, renter2] = accounts;

  const tokenId = new BN(1);

  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  before(async function () {
    this.token = await ERC721Mock.new(name, symbol);
    this.agreement = await ERC721RentAgreementMock.new();
    await this.token.mint(owner, tokenId);
  });

  describe('a contract with no agreement', async function () {
    it('is not rented', async function () {
      expect(await this.token.rentedOwnerOf(tokenId)).to.equal(
        '0x0000000000000000000000000000000000000000',
      );
    });

    it('has no agreement contract', async function () {
      expect(await this.token.rentAggreementOf(tokenId)).to.equal(
        '0x0000000000000000000000000000000000000000',
      );
    });

    it('cannot be rented', async function () {
      await expectRevert(
        this.token.acceptRentAgreement(owner, tokenId),
        'ERC721: rent without rent agreement',
      );
      await expectRevert(
        this.token.acceptRentAgreement(renter, tokenId),
        'ERC721: rent without rent agreement',
      );
    });

    it('cannot stop being rented', async function () {
      await expectRevert(
        this.token.stopRentAgreement(tokenId, { from: renter }),
        'ERC721: token is not rented',
      );
    });

    it('can set an agreement', async function () {
      await this.token.setRentAgreement(this.agreement.address, tokenId, {
        from: owner,
      });
    });
  });

  describe('a contract with an agreement accepting all', async function () {
    it('has the expected agreement', async function () {
      expect(await this.token.rentAggreementOf(tokenId)).to.equal(
        this.agreement.address,
      );
    });

    it('cannot be rented by its owner', async function () {
      await expectRevert(
        this.token.acceptRentAgreement(owner, tokenId),
        'ERC721: rent to current owner',
      );
    });

    it('can be rented by someone else', async function () {
      expectEvent(
        await this.token.acceptRentAgreement(renter, tokenId),
        'Transfer',
        { from: owner, to: renter, tokenId: tokenId },
      );
    });

    it('becomes rented', async function () {
      expect(await this.token.rentedOwnerOf(tokenId)).to.equal(owner);
    });

    it('display the right owner', async function () {
      expect(await this.token.ownerOf(tokenId)).to.equal(renter);
    });

    it('has the right balance', async function () {
      expect((await this.token.balanceOf(owner)).toNumber()).to.equal(0);
      expect((await this.token.balanceOf(renter)).toNumber()).to.equal(1);
    });

    it('does not allow the transfer of the token', async function () {
      await expectRevert(
        this.token.transferFrom(owner, renter2, tokenId, { from: owner }),
        'ERC721: token is rented',
      );
      await expectRevert(
        this.token.transferFrom(renter, renter2, tokenId, { from: renter }),
        'ERC721: token is rented',
      );
      await expectRevert(
        this.token.safeTransferFrom(owner, renter2, tokenId, { from: owner }),
        'ERC721: token is rented',
      );
      await expectRevert(
        this.token.safeTransferFrom(renter, renter2, tokenId, { from: renter }),
        'ERC721: token is rented',
      );
    });

    it('does not allow the renter to change aprovals', async function () {
      await expectRevert(
        this.token.approve(renter2, tokenId, { from: renter }),
        'ERC721: approve caller is not owner nor approved for all',
      );
    });

    it('cannot be rented again', async function () {
      await expectRevert(
        this.token.acceptRentAgreement(renter, tokenId),
        'ERC721: token is rented',
      );
      await expectRevert(
        this.token.acceptRentAgreement(renter2, tokenId),
        'ERC721: token is rented',
      );
    });

    it('can stop the rental', async function () {
      expectEvent(
        await this.token.stopRentAgreement(tokenId, { from: renter }),
        'Transfer',
        { from: renter, to: owner, tokenId: tokenId },
      );
    });

    it('becomes no longer rented', async function () {
      expect(await this.token.rentedOwnerOf(tokenId)).to.equal(
        '0x0000000000000000000000000000000000000000',
      );
    });

    it('display the right owner', async function () {
      expect(await this.token.ownerOf(tokenId)).to.equal(owner);
    });

    it('has the right balance', async function () {
      expect((await this.token.balanceOf(owner)).toNumber()).to.equal(1);
      expect((await this.token.balanceOf(renter)).toNumber()).to.equal(0);
    });

    it('can be rented again by someone else', async function () {
      expectEvent(
        await this.token.acceptRentAgreement(renter2, tokenId),
        'Transfer',
        { from: owner, to: renter2, tokenId: tokenId },
      );
    });

    it('is rented again', async function () {
      expect(await this.token.rentedOwnerOf(tokenId)).to.equal(owner);
    });

    it('can be stopped by the owner', async function () {
      expectEvent(
        await this.token.stopRentAgreement(tokenId, { from: owner }),
        'Transfer',
        { from: renter2, to: owner, tokenId: tokenId },
      );
    });

    it('cannot change the agreement during a rental', async function () {
      expectEvent(
        await this.token.acceptRentAgreement(renter2, tokenId),
        'Transfer',
        { from: owner, to: renter2, tokenId: tokenId },
      );
      await expectRevert(
        this.token.setRentAgreement(this.agreement.address, tokenId, {
          from: owner,
        }),
        'ERC721: token is rented',
      );
      expectEvent(
        await this.token.stopRentAgreement(tokenId, { from: renter }),
        'Transfer',
        { from: renter2, to: owner, tokenId: tokenId },
      );
    });
  });

  describe('a contract with an agreement refusing changes', async function () {
    it('cannot change the rental aggreement', async function () {
      await this.agreement.setFail(true);
      await expectRevert(
        this.token.setRentAgreement(this.agreement.address, tokenId, {
          from: owner,
        }),
        'Failed from agreement contract',
      );
    });

    it('cannot start the rental aggreement', async function () {
      await expectRevert(
        this.token.acceptRentAgreement(renter, tokenId),
        'Failed from agreement contract',
      );
    });

    it('cannot stop the rental aggreement', async function () {
      await this.agreement.setFail(false);
      this.token.acceptRentAgreement(renter, tokenId);
      await this.agreement.setFail(true);
      await expectRevert(
        this.token.stopRentAgreement(tokenId, { from: owner }),
        'Failed from agreement contract',
      );
      await expectRevert(
        this.token.stopRentAgreement(tokenId, { from: renter }),
        'Failed from agreement contract',
      );
    });
  });

  describe('when a token changes owner', async function () {
    it('removes the agreement contract', async function () {
      await this.agreement.setFail(false);
      await this.token.stopRentAgreement(tokenId, { from: renter });
      expect(await this.token.rentAggreementOf(tokenId)).to.equal(
        this.agreement.address,
      );
      await this.token.transferFrom(owner, renter, tokenId, { from: owner });
      expect(await this.token.rentAggreementOf(tokenId)).to.equal(
        '0x0000000000000000000000000000000000000000',
      );
    });
  });
});
