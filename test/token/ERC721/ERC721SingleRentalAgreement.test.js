const { BN, time, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const ERC721Mock = artifacts.require('ERC721Mock');
const ERC721SingleRentalAgreement = artifacts.require('ERC721SingleRentalAgreement');

const RENT_STATUS = {
  PENDING: 0,
  ACTIVE: 1,
  FINISHED: 2,
};

contract('ERC721SingleRentalAgreement', function (accounts) {
  beforeEach(async function () {
    // Rental period.
    this.duration = new BN('604800'); // One week.
    /// Expiration period.
    this.exp = new BN('1814400'); // Three weeks.
    this.latestTime = await time.latest();
    this.expirationDate = this.latestTime.add(this.exp);

    // Fees.
    this.rentalFees = new BN('20000');

    // Accounts.
    [this.owner, this.renter, this.otherAccount] = accounts;

    // Erc721 contracts
    this.name = 'Non Fungible Token';
    this.symbol = 'NFT';
    this.erc721 = await ERC721Mock.new(this.name, this.symbol);
    this.tokenId = new BN('12345');
    this.erc721.mint(this.owner, this.tokenId);

    // Initialize a new contract.
    this.erc721SingleRentalAgreement = await ERC721SingleRentalAgreement.new(
      this.erc721.address,
      this.tokenId,
      this.duration,
      this.expirationDate,
      this.rentalFees,
    );

    // Set Rent agreement.
    await this.erc721.setRentalAgreement(this.erc721SingleRentalAgreement.address, this.tokenId, { from: this.owner });
  });

  context('Initial state', async function () {
    it('contract initial is pending', async function () {
      const status = await this.erc721SingleRentalAgreement.rentalStatus();
      expect(status.toNumber()).to.equal(RENT_STATUS.PENDING);
    });

    it('owner', async function () {
      const owner = await this.erc721SingleRentalAgreement.getOwner();
      expect(owner).to.equal(this.owner);
    });

    it('duration', async function () {
      const duration = await this.erc721SingleRentalAgreement.getRentalDuration();
      expect(duration.toNumber()).to.equal(this.duration.toNumber());
    });

    it('rentalFees', async function () {
      const fees = await this.erc721SingleRentalAgreement.getRentalFees();
      expect(fees.toNumber()).to.equal(this.rentalFees.toNumber());
    });

    it('Only erc721 contract can update state', async function () {
      await expectRevert(
        this.erc721SingleRentalAgreement.afterAgreementRemoved(this.tokenId, { from: this.renter }),
        'ERC721SingleRentalAgreement: only erc721Contract contract can modify rental agreement state',
      );
    });

    it('Enable to change agreement when status is pending', async function () {
      await this.erc721SingleRentalAgreement.afterAgreementRemoved(this.tokenId, { from: this.erc721.address });
    });
  });

  context('start rent', async function () {
    it('Address balances', async function () {
      // Pay rent with exceeded amount.
      await this.erc721SingleRentalAgreement.payAndStartRent({ from: this.renter, value: 2 * this.rentalFees });
      const renter = await this.erc721SingleRentalAgreement.getRenter();
      expect(renter).to.equal(this.renter);
      const ownerBalance = await this.erc721SingleRentalAgreement.balances(this.owner);
      const renterBalance = await this.erc721SingleRentalAgreement.balances(this.owner);
      expect(ownerBalance.toNumber()).to.equal(this.rentalFees.toNumber());
      expect(renterBalance.toNumber()).to.equal(this.rentalFees.toNumber());
    });

    it('Cannot start rent after expiration date', async function () {
      await time.increase(1814400); // Increase ganache time by 3 weeks.

      // Attempt to pay and start rent.
      await expectRevert(
        this.erc721SingleRentalAgreement.payAndStartRent({ from: this.renter, value: this.rentalFees }),
        'ERC721SingleRentalAgreement: rental agreement expired',
      );
    });

    it('Start rent', async function () {
      // Pay rent.
      await this.erc721SingleRentalAgreement.payAndStartRent({ from: this.renter, value: this.rentalFees });
      const status = await this.erc721SingleRentalAgreement.rentalStatus();
      expect(status.toNumber()).to.equal(RENT_STATUS.ACTIVE);
    });

    it('Cannot change agreement after the rent has started', async function () {
      // Pay rent.
      await this.erc721SingleRentalAgreement.payAndStartRent({ from: this.renter, value: this.rentalFees });
      await expectRevert(
        this.erc721SingleRentalAgreement.afterAgreementRemoved(this.tokenId, { from: this.erc721.address }),
        'ERC721SingleRentalAgreement: rental agreement has to be pending to be updated',
      );
    });
  });

  const startRent = async function (agreement, renter, fees, erc721, tokenId) {
    // Pay and start rent.
    await agreement.payAndStartRent({ from: renter, value: fees });
  };

  context('Finish rent', async function () {
    it('Owner and renter cannot finish rent before the rental period is over', async function () {
      await startRent(this.erc721SingleRentalAgreement, this.renter, this.rentalFees, this.erc721, this.tokenId);
      await expectRevert(
        this.erc721.stopRentalAgreement(this.tokenId, { from: this.owner }),
        'ERC721SingleRentalAgreement: rental period not finished yet',
      );
      await expectRevert(
        this.erc721.stopRentalAgreement(this.tokenId, { from: this.renter }),
        'ERC721SingleRentalAgreement: rental period not finished yet',
      );
    });
    it('Cannot stop rent for a different token Id', async function () {
      await startRent(this.erc721SingleRentalAgreement, this.renter, this.rentalFees, this.erc721, this.tokenId);
      await expectRevert(
        this.erc721SingleRentalAgreement.afterRentalStopped.call(this.owner, this.tokenId + 1, {
          from: this.erc721.address,
        }),
        'ERC721SingleRentalAgreement: invalid token id',
      );
    });
    it('Only owner, approver, operator or renter can finish rent', async function () {
      await startRent(this.erc721SingleRentalAgreement, this.renter, this.rentalFees, this.erc721, this.tokenId);
      await time.increase(1809600); // Increase Ganache time by 2 weeks.
      await expectRevert(
        this.erc721.stopRentalAgreement(this.tokenId, { from: this.otherAccount }),
        'ERC721SingleRentalAgreement: only owner, approver or renter can finish rent',
      );
      await this.erc721.stopRentalAgreement(this.tokenId, { from: this.owner });
      const status = await this.erc721SingleRentalAgreement.rentalStatus();
      expect(status.toNumber()).to.equal(RENT_STATUS.FINISHED);
    });
    it('Redeem funds', async function () {
      await startRent(this.erc721SingleRentalAgreement, this.renter, 2 * this.rentalFees, this.erc721, this.tokenId);
      // Renter can redeem their exceeded balance even if the rental period finished yet.
      await this.erc721SingleRentalAgreement.redeemFunds(this.rentalFees, { from: this.renter });

      // Owner cannot redeem their funds only when the rental period is not over.
      await expectRevert(
        this.erc721SingleRentalAgreement.redeemFunds(this.rentalFees, { from: this.owner }),
        'ERC721SingleRentalAgreement: rental has to be finished to redeem funds',
      );

      await time.increase(1809600); // Increase Ganache time by 2 weeks.
      await this.erc721.stopRentalAgreement(this.tokenId, { from: this.owner });

      // Owner can't redeem more than their balance.
      await expectRevert(
        this.erc721SingleRentalAgreement.redeemFunds(this.rentalFees + 1, { from: this.owner }),
        'ERC721SingleRentalAgreement: not enough funds to redeem',
      );

      // Owner can redeem their balance.
      await this.erc721SingleRentalAgreement.redeemFunds(this.rentalFees, { from: this.owner });
    });
  });
});
