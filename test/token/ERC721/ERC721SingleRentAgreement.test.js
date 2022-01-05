const { BN, time, expectRevert } = require('@openzeppelin/test-helpers');
const { assert, expect } = require('chai');

const ERC721Mock = artifacts.require('ERC721Mock');
const ERC721SingleRentAgreement = artifacts.require('ERC721SingleRentAgreement');

const RENT_STATUS = {
  PENDING: 0,
  ACTIVE: 1,
  FINISHED: 2,
};

contract('ERC721SingleRentAgreement', function (accounts) {
  beforeEach(async function () {
    // Rental period.
    this.duration = new BN('604800'); // One week.
    this.exp = new BN('1814400'); // Three weeks.
    this.latestTime = await time.latest();
    this.expirationDate = this.latestTime.add(this.exp);

    // Fees.
    this.rentalFees = new BN('20000');

    // Accounts.
    [this.owner, this.renter] = accounts;

    // Erc721 contracts
    this.name = 'Non Fungible Token';
    this.symbol = 'NFT';
    this.erc721 = await ERC721Mock.new(this.name, this.symbol);
    this.erc721Address = this.erc721.address;
    this.tokenId = new BN('12345');
    this.erc721.mint(this.owner, this.tokenId);

    // Initialize a new contract.
    this.erc721SingleRentAgreement = await ERC721SingleRentAgreement.new(
      this.owner,
      this.renter,
      this.erc721Address,
      this.duration,
      this.expirationDate,
      this.rentalFees,
    );

    // Set Rent agreement.
    await this.erc721.setRentAgreement(this.erc721SingleRentAgreement.address, this.tokenId, { from: this.owner });
  });

  context('Start Rent', async function () {
    it('contract initial is pending', async function () {
      const status = await this.erc721SingleRentAgreement.rentStatus();
      expect(status.toNumber()).to.equal(RENT_STATUS.PENDING);
    });

    it('Only erc721 contract can update state', async function () {
      await expectRevert(
        this.erc721SingleRentAgreement.afterRentAgreementReplaced(this.tokenId, { from: this.renter }),
        'Only erc721Contract contract can modify rent agreement state',
      );
    });

    it('Cannot start rent if rent not paid', async function () {
      await expectRevert(
        this.erc721.acceptRentAgreement(this.renter, this.tokenId, { from: this.renter }),
        'Rent has to be paid first',
      );
    });

    it('Wrong rent fees', async function () {
      // Pay rent with wrong fee amount.
      await expectRevert(
        this.erc721SingleRentAgreement.payRent({ from: this.renter, value: this.rentalFees + 1 }),
        'Wrong rental fees amount',
      );
    });

    it('Enable to start rent after rent is paid', async function () {
      // Pay rent.
      await this.erc721SingleRentAgreement.payRent({ from: this.renter, value: this.rentalFees });
      const rentPaid = await this.erc721SingleRentAgreement.rentPaid();
      assert.equal(rentPaid, true);

      // Assert rent is active.
      await this.erc721.acceptRentAgreement(this.renter, this.tokenId, { from: this.renter });
      const status = await this.erc721SingleRentAgreement.rentStatus();
      expect(status.toString()).to.equal(RENT_STATUS.ACTIVE.toString());
    });

    it('Enable to change agreement when pending and not paid', async function () {
      await this.erc721SingleRentAgreement.afterRentAgreementReplaced(this.tokenId, { from: this.erc721Address });
    });

    it('Cannot change agreement after the rent has been paid', async function () {
      // Pay rent.
      await this.erc721SingleRentAgreement.payRent({ from: this.renter, value: this.rentalFees });
      await expectRevert(
        this.erc721SingleRentAgreement.afterRentAgreementReplaced(this.tokenId, { from: this.erc721Address }),
        'Rent already paid',
      );
    });

    it('Cannot start rent after expiration date', async function () {
      await time.increase(1814400); // Increase ganache time by 3 weeks.

      // Pay rent.
      await expectRevert(
        this.erc721SingleRentAgreement.payRent({ from: this.renter, value: this.rentalFees }),
        'rental agreement expired',
      );
    });
  });

  const startRent = async function (agreement, renter, fees, erc721, tokenId) {
    // Pay rent.
    await agreement.payRent({ from: renter, value: fees });
    // Start rent.
    await erc721.acceptRentAgreement(renter, tokenId, { from: renter });
  };

  context('Finish rent', async function () {
    it('Owner cannot finish rent before the rental period is over', async function () {
      await startRent(this.erc721SingleRentAgreement, this.renter, this.rentalFees, this.erc721, this.tokenId);
      await expectRevert(
        this.erc721.stopRentAgreement(this.tokenId, { from: this.owner }),
        'Rental period not finished yet',
      );
    });

    it('Owner is able to finish rent after the rental period is over', async function () {
      await startRent(this.erc721SingleRentAgreement, this.renter, this.rentalFees, this.erc721, this.tokenId);
      await time.increase(1809600); // Increase Ganache time by 2 weeks.
      await this.erc721.stopRentAgreement(this.tokenId, { from: this.owner });
    });

    it('Renter is able to finish rent before the rental period is over', async function () {
      await startRent(this.erc721SingleRentAgreement, this.renter, this.rentalFees, this.erc721, this.tokenId);
      await time.increase(302400); // Increase Ganache time by 3.5 days.
      await this.erc721.stopRentAgreement(this.tokenId, { from: this.renter });
      const renterBalance = await this.erc721SingleRentAgreement.balances(this.renter);
      const ownerBalance = await this.erc721SingleRentAgreement.balances(this.owner);
      const expectedBalance = new BN(10000);
      assert.equal(renterBalance.toNumber(), expectedBalance.toNumber());
      assert.equal(ownerBalance.toNumber(), expectedBalance.toNumber());
    });
  });
});
