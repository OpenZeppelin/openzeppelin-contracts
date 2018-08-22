const { expectThrow } = require('../helpers/expectThrow');
const expectEvent = require('../helpers/expectEvent');

const Superuser = artifacts.require('Superuser');

require('chai')
  .should();

contract('Superuser', function ([_, firstOwner, newSuperuser, newOwner, anyone]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    this.superuser = await Superuser.new({ from: firstOwner });
  });

  context('in normal conditions', function () {
    it('should set the owner as the default superuser', async function () {
      (await this.superuser.isSuperuser(firstOwner)).should.equal(true);
    });

    it('should change superuser after transferring', async function () {
      await this.superuser.transferSuperuser(newSuperuser, { from: firstOwner });

      (await this.superuser.isSuperuser(firstOwner)).should.equal(false);

      (await this.superuser.isSuperuser(newSuperuser)).should.equal(true);
    });

    it('should prevent changing to a null superuser', async function () {
      await expectThrow(
        this.superuser.transferSuperuser(ZERO_ADDRESS, { from: firstOwner })
      );
    });

    it('should change owner after the superuser transfers the ownership', async function () {
      await this.superuser.transferSuperuser(newSuperuser, { from: firstOwner });

      await expectEvent.inTransaction(
        this.superuser.transferOwnership(newOwner, { from: newSuperuser }),
        'OwnershipTransferred'
      );

      (await this.superuser.owner()).should.equal(newOwner);
    });

    it('should change owner after the owner transfers the ownership', async function () {
      await expectEvent.inTransaction(
        this.superuser.transferOwnership(newOwner, { from: firstOwner }),
        'OwnershipTransferred'
      );

      (await this.superuser.owner()).should.equal(newOwner);
    });
  });

  context('in adversarial conditions', function () {
    it('should prevent non-superusers from transfering the superuser role', async function () {
      await expectThrow(
        this.superuser.transferSuperuser(newOwner, { from: anyone })
      );
    });

    it('should prevent users that are not superuser nor owner from setting a new owner', async function () {
      await expectThrow(
        this.superuser.transferOwnership(newOwner, { from: anyone })
      );
    });
  });
});
