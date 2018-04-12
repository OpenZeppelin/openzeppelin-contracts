import expectEvent from '../../helpers/expectEvent';
import assertRevert from '../../helpers/assertRevert';
const RBACOwnable = artifacts.require('RBACOwnable');

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('RBACOwnable', ([owner, newOwner, anyone]) => {
  let ownable;
  let role;

  before(async () => {
    ownable = await RBACOwnable.new({ from: owner });
    role = await ownable.ROLE_OWNER();
  });

  it('should have a default owner of self', async () => {
    const hasRole = await ownable.hasRole(owner, role);

    hasRole.should.eq(true);
  });

  it('changes owner after transfer', async () => {
    await ownable.transferOwnership(newOwner);
    const hasRole = await ownable.hasRole(newOwner, role);
    const ownerHasRole = await ownable.hasRole(owner, role);

    hasRole.should.eq(true);
    ownerHasRole.should.eq(false);
  });

  it('should prevent non-owners from transfering', async () => {
    await assertRevert(
      ownable.transferOwnership(owner, { from: anyone })
    );
  });

  it('should guard ownership against stuck state', async () => {
    await assertRevert(
      ownable.transferOwnership(null, { from: newOwner })
    );
  });

  it('should emit OwnershipTransferred', async () => {
    await expectEvent.inTransaction(
      ownable.transferOwnership(owner, { from: newOwner }),
      'OwnershipTransferred'
    );
  });
});
