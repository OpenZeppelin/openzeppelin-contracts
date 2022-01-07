const { BN, time, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const ERC721Mock = artifacts.require('ERC721Mock');
const ERC721SwapRentalAgreement = artifacts.require('ERC721SwapRentalAgreement');

const RENTAL_STATUS = {
  PENDING: 0,
  ACTIVE: 1,
};

contract('ERC721SwapRentalAgreement', function (accounts) {
  before(async function () {
    // Accounts.
    [this.owner1, this.owner2, this.otherAccount] = accounts;

    // Token1 contract.
    this.name1 = 'Non Fungible Token 1';
    this.symbol1 = 'NFT1';
    this.token1 = await ERC721Mock.new(this.name1, this.symbol1);
    this.tokenId1 = new BN('1');
    await this.token1.mint(this.owner1, this.tokenId1);

    // Token2 contract.
    this.name2 = 'Non Fungible Token 2';
    this.symbol2 = 'NFT2';
    this.token2 = await ERC721Mock.new(this.name2, this.symbol2);
    this.tokenId2 = new BN('2');
    await this.token2.mint(this.owner2, this.tokenId2);

    // Non registered token.
    this.name3 = 'Non Fungible Token 3';
    this.symbol3 = 'NFT3';
    // Mint the same token id for owner2 in the non registered contract.
    // That will make pass the requires in the `setRentalAgreement` function.
    this.nonRegisteredToken = await ERC721Mock.new(this.name3, this.symbol3);
    await this.nonRegisteredToken.mint(this.owner2, this.tokenId2);

    // Rental period.
    this.rentalDuration = new BN('604800'); // One week.
    this.expireDuration = new BN('1209600'); // Tow weeks.
    this.latestTime = await time.latest();
    this.expirationDate = await this.latestTime.add(this.expireDuration);

    // Initialize a new swap rental contract.
    this.erc721SwapRentalAgreement = await ERC721SwapRentalAgreement.new(
      this.token1.address,
      this.token2.address,
      this.tokenId1,
      this.tokenId2,
      this.rentalDuration,
      this.expirationDate,
    );

    // Set Rent agreement.
    await this.token1.setRentalAgreement(this.erc721SwapRentalAgreement.address, this.tokenId1, { from: this.owner1 });
    await this.token2.setRentalAgreement(this.erc721SwapRentalAgreement.address, this.tokenId2, { from: this.owner2 });
    await this.nonRegisteredToken.setRentalAgreement(this.erc721SwapRentalAgreement.address, this.tokenId2, {
      from: this.owner2,
    });
  });

  context('Initial state', async function () {
    it('Initial state is pending', async function () {
      const rentalAgreement = await this.erc721SwapRentalAgreement.rentalAgreement();
      expect(rentalAgreement.rentalStatus.toNumber()).to.equal(RENTAL_STATUS.PENDING);
    });

    it('Only registered contracts can modify agreement', async function () {
      // Can't start rent agreement if not registered contract.
      await expectRevert(
        this.nonRegisteredToken.acceptRentalAgreement(this.owner1, this.tokenId2, {
          from: this.owner2,
        }),
        'ERC721SwapRentalAgreement: only registered erc721 can change state',
      );
    });
  });
  context('start rent', async function () {
    it('cannot approve rent on non registered tokens', async function () {
      await expectRevert(
        this.erc721SwapRentalAgreement.approveRental(this.nonRegisteredToken.address, this.tokenId1, {
          from: this.owner1,
        }),
        'ERC721SwapRentalAgreement: token not registered',
      );

      const newTokenId = new BN('4');
      await expectRevert(
        this.erc721SwapRentalAgreement.approveRental(this.token1.address, newTokenId, { from: this.owner1 }),
        'ERC721SwapRentalAgreement: invalid token id',
      );
    });
    it('approve rent', async function () {
      await this.erc721SwapRentalAgreement.approveRental(this.token1.address, this.tokenId1, { from: this.owner1 });

      // Token 1 have been cleared for approval.
      const rentalAgreement = await this.erc721SwapRentalAgreement.rentalAgreement();
      expect(rentalAgreement.token1.approvedForRental).to.equal(true);

      expectRevert(
        this.erc721SwapRentalAgreement.startRental({ from: this.owner1 }),
        'ERC721SwapRentalAgreement: token 2 not approved for rental',
      );
    });

    it('start rent', async function () {
      await this.erc721SwapRentalAgreement.approveRental(this.token2.address, this.tokenId2, { from: this.owner2 });
      // Registered tokens have been cleared for approval.
      let rentalAgreement = await this.erc721SwapRentalAgreement.rentalAgreement();
      expect(rentalAgreement.token2.approvedForRental).to.equal(true);

      // Start rent.
      await this.erc721SwapRentalAgreement.startRental({ from: this.otherAccount });
      rentalAgreement = await this.erc721SwapRentalAgreement.rentalAgreement();
      expect(rentalAgreement.rentalStatus.toNumber()).to.equal(RENTAL_STATUS.ACTIVE);
    });
  });

  context('Stop rent', async function () {
    it('Cannot finish rent before the rental period is over', async function () {
      await expectRevert(
        this.erc721SwapRentalAgreement.stopRental({ from: this.owner1 }),
        'ERC721SwapRentalAgreement: rental period not finished yet',
      );
    });

    it('finish rent', async function () {
      await time.increase(1209600); // Increase Ganache time by 2 weeks.
      await this.erc721SwapRentalAgreement.stopRental({ from: this.owner1 });
      const rentalAgreement = await this.erc721SwapRentalAgreement.rentalAgreement();
      expect(rentalAgreement.rentalStatus.toNumber()).to.equal(RENTAL_STATUS.PENDING);
      expect(rentalAgreement.token1.approvedForRental).to.equal(false);
      expect(rentalAgreement.token2.approvedForRental).to.equal(false);
    });
  });

  context('Rent expired', async function () {
    it('Cannot start rental period if rent expired', async function () {
      // Re-approve the rent.
      await this.erc721SwapRentalAgreement.approveRental(this.token1.address, this.tokenId1, { from: this.owner1 });
      await this.erc721SwapRentalAgreement.approveRental(this.token2.address, this.tokenId2, { from: this.owner2 });

      // Increase time.
      await time.increase(1814400); // Increase Ganache time by 3 weeks.
      await expectRevert(
        this.erc721SwapRentalAgreement.startRental({ from: this.otherAccount }),
        'ERC721SwapRentalAgreement: rental expired',
      );
    });
  });
});
