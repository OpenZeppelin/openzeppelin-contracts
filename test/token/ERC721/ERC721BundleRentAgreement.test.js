const {
  BN,
  time,
  balance,
  expectEvent,
  expectRevert,
} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const ERC721Mock = artifacts.require('ERC721Mock');
const ERC721BundleRentalAgreement = artifacts.require(
  'ERC721BundleRentalAgreement',
);

contract('ERC721BundleRentalAgreement', function (accounts) {
  const [owner, renter, approved, approvedForAll, other] = accounts;
  const tokenId = new BN(1);

  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  const defaultPricePerSecond = new BN(10);
  const defaultCancelationFee = new BN(10000);

  before(async function () {
    this.token = await ERC721Mock.new(name, symbol);
    this.agreement = await ERC721BundleRentalAgreement.new(
      defaultPricePerSecond,
      defaultCancelationFee,
    );
    await this.token.mint(owner, tokenId);
    await this.token.setRentalAgreement(this.agreement.address, tokenId, {
      from: owner,
    });
  });

  describe('unauthorized action are reverted', async function () {
    it('cannot call IERC721RentalAgreement to modify state', async function () {
      expect(
        ERC721BundleRentalAgreement.abi.find(
          (abi) => abi.name === 'afterAgreementRemoved',
        ).constant,
      ).to.equal(true);
      expect(
        ERC721BundleRentalAgreement.abi.find(
          (abi) => abi.name === 'afterRentalStarted',
        ).constant,
      ).to.equal(true);

      await expectRevert(
        this.agreement.afterRentalStopped(
          '0x0000000000000000000000000000000000000000',
          tokenId,
          { from: owner },
        ),
        'IERC721RentalAgreement: token is not rented',
      );
    });

    it('cannot start renting of 0 seconds', async function () {
      await expectRevert(
        this.agreement.payAndStartRent(this.token.address, tokenId, new BN(0), {
          from: renter,
        }),
        'IERC721RentalAgreement: rental duration',
      );
    });

    it('cannot start renting without paying', async function () {
      await expectRevert(
        this.agreement.payAndStartRent(this.token.address, tokenId, new BN(1), {
          from: renter,
        }),
        'IERC721RentalAgreement: rental price not matched',
      );
    });

    it('cannot cancel not started rental', async function () {
      await expectRevert(
        this.agreement.payAndCancelRent(this.token.address, tokenId, {
          from: renter,
        }),
        'IERC721RentalAgreement: token is not rented',
      );
    });

    it('cannot finish not started rental', async function () {
      await expectRevert(
        this.agreement.finishRent(this.token.address, tokenId, {
          from: renter,
        }),
        'ERC721: token is not rented',
      );
    });

    it('cannot ask for cancelation fee of not rented token', async function () {
      await expectRevert(
        this.agreement.cancelationFeesForRenter(this.token.address, tokenId, {
          from: renter,
        }),
        'IERC721RentalAgreement: token is not rented',
      );
      await expectRevert(
        this.agreement.cancelationFeesForOwner(this.token.address, tokenId, {
          from: renter,
        }),
        'IERC721RentalAgreement: token is not rented',
      );
    });

    it('does not give rent to renter', async function () {
      await expectRevert(
        this.agreement.redeemRent(
          this.token.address,
          tokenId,
          '0x0000000000000000000000000000000000000000',
          {
            from: renter,
          },
        ),
        'IERC721RentalAgreement: only owner or approved of token',
      );
    });

    it('cannot change price if not owner', async function () {
      await expectRevert(
        this.agreement.setTokenPriceInWeiPerSecond(
          this.token.address,
          tokenId,
          new BN(1),
          { from: renter },
        ),
        'IERC721RentalAgreement: only owner or approved of token',
      );
    });

    it('cannot change cancelation fee if not owner', async function () {
      await expectRevert(
        this.agreement.setTokenCancelationFeeInWei(
          this.token.address,
          tokenId,
          new BN(1),
          { from: renter },
        ),
        'IERC721RentalAgreement: only owner or approved of token',
      );
    });
  });

  describe('contract rental', async function () {
    it('can rent a contract', async function () {
      const result = await this.agreement.payAndStartRent(
        this.token.address,
        tokenId,
        new BN(100),
        {
          from: renter,
          value: defaultPricePerSecond.muln(100),
        },
      );
      await expectEvent.inTransaction(result.tx, ERC721Mock, 'Transfer', {
        from: owner,
        to: renter,
        tokenId: tokenId,
      });
    });

    it('has the correct information stored', async function () {
      const tokenRental = await this.agreement.tokenRentals(
        this.token.address,
        tokenId,
      );

      expect(tokenRental.startTimestamp).to.bignumber.equal(
        (await time.latest()).toString(),
      );
      expect(tokenRental.paidDurationInSecond).to.bignumber.equal('100');
      expect(tokenRental.priceInWeiPerSecond).to.bignumber.equal(
        defaultPricePerSecond.toString(),
      );
      expect(tokenRental.cancelationFeeInWei).to.bignumber.equal(
        defaultCancelationFee.toString(),
      );
    });

    it('cannot finish the contract before the end', async function () {
      await expectRevert(
        this.agreement.finishRent(this.token.address, tokenId, { from: owner }),
        'IERC721RentalAgreement: rental is not finished',
      );
      await expectRevert(
        this.agreement.finishRent(this.token.address, tokenId, {
          from: renter,
        }),
        'IERC721RentalAgreement: rental is not finished',
      );
    });

    it('has the expected cancelation fee', async function () {
      expect(
        await this.agreement.cancelationFeesForRenter(
          this.token.address,
          tokenId,
        ),
      ).to.bignumber.equal(
        defaultCancelationFee.sub(defaultPricePerSecond.muln(98)).toString(),
      );
      expect(
        await this.agreement.cancelationFeesForOwner(
          this.token.address,
          tokenId,
        ),
      ).to.bignumber.equal(defaultCancelationFee.toString());
    });

    it('cannot be cancelled by someone else', async function () {
      await expectRevert(
        this.agreement.payAndCancelRent(this.token.address, tokenId, {
          from: other,
        }),
        'IERC721RentalAgreement: only renter, owner or approved of token',
      );
    });

    it('needs a fee to be cancelled', async function () {
      await expectRevert(
        this.agreement.payAndCancelRent(this.token.address, tokenId, {
          from: owner,
        }),
        'IERC721RentalAgreement: cancelation fee not matched',
      );
      await expectRevert(
        this.agreement.payAndCancelRent(this.token.address, tokenId, {
          from: renter,
        }),
        'IERC721RentalAgreement: cancelation fee not matched',
      );
    });

    it('anybody can finish the rental after its duration', async function () {
      await time.increase(100);
      const result = await this.agreement.finishRent(
        this.token.address,
        tokenId,
        {
          from: other,
        },
      );
      await expectEvent.inTransaction(result.tx, ERC721Mock, 'Transfer', {
        from: renter,
        to: owner,
        tokenId: tokenId,
      });
    });

    it('does not allow to change the agreement if it has funds', async function () {
      await expectRevert(
        this.token.setRentalAgreement(this.agreement.address, tokenId, {
          from: owner,
        }),
        'IERC721RentalAgreement: rent has not been redeemed',
      );
    });

    it('lets the owner collect their funds', async function () {
      const rentalCost = defaultPricePerSecond.muln(100);
      const otherBalance = await balance.current(other);
      const tokenRental = await this.agreement.tokenRentals(
        this.token.address,
        tokenId,
      );

      expect(tokenRental.rentToRedeemInWei).to.bignumber.equal(
        rentalCost.toString(),
      );

      await this.agreement.redeemRent(this.token.address, tokenId, other, {
        from: owner,
      });

      expect(await balance.current(other)).to.bignumber.equal(
        otherBalance.add(rentalCost).toString(),
      );
    });

    it('allows to change the agreement', async function () {
      await this.token.setRentalAgreement(this.agreement.address, tokenId, {
        from: owner,
      });
    });
  });

  describe('changing costs', async function () {
    it('can have the token specific costs changes', async function () {
      await this.agreement.setTokenPriceInWeiPerSecond(
        this.token.address,
        tokenId,
        new BN(1),
        { from: owner },
      );
      await this.agreement.setTokenCancelationFeeInWei(
        this.token.address,
        tokenId,
        new BN(1),
        { from: owner },
      );

      const tokenRental = await this.agreement.tokenRentals(
        this.token.address,
        tokenId,
      );

      expect(tokenRental.nextPriceInWeiPerSecond).to.bignumber.equal('1');
      expect(tokenRental.nextCancelationFeeInWei).to.bignumber.equal('1');
    });

    it('can have the token specific cost changes by an approver', async function () {
      await this.token.approve(approved, tokenId, { from: owner });

      await this.agreement.setTokenPriceInWeiPerSecond(
        this.token.address,
        tokenId,
        new BN(2),
        { from: approved },
      );
      await this.agreement.setTokenCancelationFeeInWei(
        this.token.address,
        tokenId,
        new BN(2),
        { from: approved },
      );

      const tokenRental = await this.agreement.tokenRentals(
        this.token.address,
        tokenId,
      );

      expect(tokenRental.nextPriceInWeiPerSecond).to.bignumber.equal('2');
      expect(tokenRental.nextCancelationFeeInWei).to.bignumber.equal('2');
    });

    it('can have the token specific cost changes by an operator', async function () {
      await this.token.setApprovalForAll(approvedForAll, true, { from: owner });

      await this.agreement.setTokenPriceInWeiPerSecond(
        this.token.address,
        tokenId,
        new BN(1),
        { from: approvedForAll },
      );
      await this.agreement.setTokenCancelationFeeInWei(
        this.token.address,
        tokenId,
        new BN(100),
        { from: approvedForAll },
      );

      const tokenRental = await this.agreement.tokenRentals(
        this.token.address,
        tokenId,
      );

      expect(tokenRental.nextPriceInWeiPerSecond).to.bignumber.equal('1');
      expect(tokenRental.nextCancelationFeeInWei).to.bignumber.equal('100');
    });

    it('can change the costs during a rental', async function () {
      const result = await this.agreement.payAndStartRent(
        this.token.address,
        tokenId,
        new BN(10),
        {
          from: renter,
          value: new BN(10),
        },
      );
      await expectEvent.inTransaction(result.tx, ERC721Mock, 'Transfer', {
        from: owner,
        to: renter,
        tokenId: tokenId,
      });

      await this.agreement.setTokenPriceInWeiPerSecond(
        this.token.address,
        tokenId,
        new BN(11),
        { from: owner },
      );
      await this.agreement.setTokenCancelationFeeInWei(
        this.token.address,
        tokenId,
        new BN(1000),
        { from: owner },
      );

      const tokenRental = await this.agreement.tokenRentals(
        this.token.address,
        tokenId,
      );

      expect(tokenRental.nextPriceInWeiPerSecond).to.bignumber.equal('11');
      expect(tokenRental.nextCancelationFeeInWei).to.bignumber.equal('1000');
    });

    it('does not change the costs of the current rental', async function () {
      const tokenRental = await this.agreement.tokenRentals(
        this.token.address,
        tokenId,
      );

      expect(tokenRental.priceInWeiPerSecond).to.bignumber.equal('1');
      expect(tokenRental.cancelationFeeInWei).to.bignumber.equal('100');
    });
  });

  describe('contract cancelling', async function () {
    it('refunds the renter if the owner cancels', async function () {
      const renterBalance = await balance.current(renter);
      const result = await this.agreement.payAndCancelRent(
        this.token.address,
        tokenId,
        { from: owner, value: new BN(100) },
      );

      await expectEvent.inTransaction(result.tx, ERC721Mock, 'Transfer', {
        from: renter,
        to: owner,
        tokenId: tokenId,
      });

      expect(await balance.current(renter)).to.bignumber.above(
        renterBalance.toString(),
      );
    });

    it('refunds the renter if the renter cancels and paid too much', async function () {
      await this.agreement.payAndStartRent(
        this.token.address,
        tokenId,
        new BN(10000000),
        {
          from: renter,
          value: new BN(11).muln(10000000),
        },
      );

      const renterBalance = await balance.current(renter);
      const tx = await this.agreement.payAndCancelRent(
        this.token.address,
        tokenId,
        {
          from: renter,
        },
      );

      expect(await balance.current(renter)).to.bignumber.above(
        renterBalance
          .sub(new BN(tx.receipt.effectiveGasPrice).muln(tx.receipt.gasUsed))
          .toString(),
      );
    });

    it('needs a fee if the renter cancels and did not pay enough', async function () {
      await this.agreement.payAndStartRent(
        this.token.address,
        tokenId,
        new BN(10),
        {
          from: renter,
          value: new BN(11).muln(10),
        },
      );

      await this.agreement.payAndCancelRent(this.token.address, tokenId, {
        from: renter,
        value: new BN(1000).sub(new BN(9).muln(11)),
      });
    });

    it('has funds to redeem', async function () {
      const tokenRental = await this.agreement.tokenRentals(
        this.token.address,
        tokenId,
      );

      expect(tokenRental.rentToRedeemInWei).to.bignumber.above('0');
    });
  });

  describe('multiple tokens', async function () {
    before(async function () {
      this.token2 = await ERC721Mock.new(name, symbol);
      await this.token2.mint(owner, tokenId);
      await this.token2.setRentalAgreement(this.agreement.address, tokenId, {
        from: owner,
      });
    });

    it('allows to rent two tokens at the same time', async function () {
      const result = await this.agreement.payAndStartRent(
        this.token.address,
        tokenId,
        new BN(20),
        {
          from: renter,
          value: new BN(11).muln(20),
        },
      );
      const result2 = await this.agreement.payAndStartRent(
        this.token2.address,
        tokenId,
        new BN(10),
        {
          from: renter,
          value: defaultPricePerSecond.muln(10),
        },
      );

      await expectEvent.inTransaction(result.tx, ERC721Mock, 'Transfer', {
        from: owner,
        to: renter,
        tokenId: tokenId,
      });
      await expectEvent.inTransaction(result2.tx, ERC721Mock, 'Transfer', {
        from: owner,
        to: renter,
        tokenId: tokenId,
      });
    });
  });
});
