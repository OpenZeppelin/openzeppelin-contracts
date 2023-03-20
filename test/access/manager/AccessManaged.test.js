const { expectEvent, expectRevert, constants: { ZERO_ADDRESS } } = require('@openzeppelin/test-helpers');

const AccessManaged = artifacts.require('$AccessManagedMock');
const SimpleAuthority = artifacts.require('SimpleAuthority');

contract('AccessManager', function ([authority, other, user]) {
  it('construction', async function () {
    const managed = await AccessManaged.new(authority);
    expectEvent.inConstruction(managed, 'AuthorityUpdated', {
      oldAuthority: ZERO_ADDRESS,
      newAuthority: authority,
    });
    expect(await managed.authority()).to.equal(authority);
  });

  describe('setAuthority', function () {
    it(`current authority can change managed's authority`, async function () {
      const managed = await AccessManaged.new(authority);
      const set = await managed.setAuthority(other, { from: authority });
      expectEvent(set, 'AuthorityUpdated', {
        oldAuthority: authority,
        newAuthority: other,
      });
      expect(await managed.authority()).to.equal(other);
    });

    it(`other account cannot change managed's authority`, async function () {
      const managed = await AccessManaged.new(authority);
      await expectRevert(
        managed.setAuthority(other, { from: other }),
        'AccessManaged: not current authority',
      );
    });
  });

  describe('restricted', function () {
    const selector = web3.eth.abi.encodeFunctionSignature('restrictedFunction()');

    it('allows if authority says true', async function () {
      const authority = await SimpleAuthority.new();
      const managed = await AccessManaged.new(authority.address);
      await authority.setAllowed(user, managed.address, selector);
      const restricted = await managed.restrictedFunction({ from: user });
      expectEvent(restricted, 'RestrictedRan');
    });

    it('reverts if authority says false', async function () {
      const authority = await SimpleAuthority.new();
      const managed = await AccessManaged.new(authority.address);
      await expectRevert(
        managed.restrictedFunction({ from: user }),
        'AccessManaged: authority rejected',
      );
    });
  });
});
