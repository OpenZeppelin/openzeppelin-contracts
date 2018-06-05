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
    finalOwner,
    anyone,
  ] = accounts;

  before(async function () {
    this.superuser = await Superuser.new();
  });

  context('in normal conditions', () => {
    it('should set the owner as the default superuser', async function () {
      const ownerIsSuperuser = await this.superuser.isSuperuser(firstOwner);
      ownerIsSuperuser.should.be.equal(true);
    });

    it('should change superuser after transferring', async function () {
      await this.superuser.transferSuperuser(newSuperuser, { from: firstOwner });
      
      const ownerIsSuperuser = await this.superuser.isSuperuser(firstOwner);
      ownerIsSuperuser.should.be.equal(false);

      const address1IsSuperuser = await this.superuser.isSuperuser(newSuperuser);
      address1IsSuperuser.should.be.equal(true);
    });

    it('should change owner after the superuser transfers the ownership', async function () {
      await expectEvent.inTransaction(
        this.superuser.transferOwnership(newOwner, { from: newSuperuser }),
        'OwnershipTransferred'
      );

      const currentOwner = await this.superuser.owner();
      currentOwner.should.be.equal(newOwner);
    });

    it('should change owner after the owner transfers the ownership', async function () {
      await expectEvent.inTransaction(
        this.superuser.transferOwnership(finalOwner, { from: newOwner }),
        'OwnershipTransferred'
      );

      const currentOwner = await this.superuser.owner();
      currentOwner.should.be.equal(finalOwner);
    });
  });

  context('in adversarial conditions', () => {
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
