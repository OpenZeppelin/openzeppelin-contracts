import expectThrow from '../helpers/expectThrow';
import expectEvent from '../helpers/expectEvent';

const Superuser = artifacts.require('Superuser');

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('Superuser', function (accounts) {
  const [
    firstOwner,
    newSuperuser,
    newOwner,
    anyone,
  ] = accounts;

  before(async function () {
    this.superuser = await Superuser.new();
  });

  context('in normal conditions', () => {
    it('should set the owner as the default superuser', async function () {
      const ownerIsSuperuser = await this.superuser.superuser(firstOwner);
      ownerIsSuperuser.should.be.equal(true);
    });

    it('should change superuser after transferring', async function () {
      await expectEvent.inTransaction(
        this.superuser.transferSuperuser(newSuperuser, { from: firstOwner }),
        'SuperuserTransferred'
      );
      const ownerIsSuperuser = await this.superuser.superuser(firstOwner);
      ownerIsSuperuser.should.be.equal(false);

      const address1IsSuperuser = await this.superuser.superuser(newSuperuser);
      address1IsSuperuser.should.be.equal(true);
    });

    it('should change owner after transferring', async function () {
      await expectEvent.inTransaction(
        this.superuser.transferOwnership(newOwner, { from: newSuperuser }),
        'OwnershipTransferred'
      );

      // await this.superuser.transferOwnership(newOwner, { from: newSuperuser });
      const currentOwner = await this.superuser.owner();
      currentOwner.should.be.equal(newOwner);
    });
  });

  context('in adversarial conditions', () => {
    it('should prevent non-superusers from transfering the superuser role', async function () {
      await expectThrow(
        this.superuser.transferSuperuser(newOwner, { from: anyone })
      );
    });

    it('should prevent non-superusers from setting a new owner', async function () {
      await expectThrow(
        this.superuser.transferOwnership(newOwner, { from: anyone })
      );
    });
  });
});
