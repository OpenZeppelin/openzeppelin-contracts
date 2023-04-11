const {
  expectEvent,
  expectRevert,
  constants: { ZERO_ADDRESS },
} = require('@openzeppelin/test-helpers');

const AccessManageable = artifacts.require('$AccessManageableMock');
const SimpleAuthority = artifacts.require('SimpleAuthority');

contract('AccessManageable', function (accounts) {
  const [authority, other, user] = accounts;
  it('construction', async function () {
    const manageable = await AccessManageable.new(authority);
    expectEvent.inConstruction(manageable, 'AuthorityUpdated', {
      oldAuthority: ZERO_ADDRESS,
      newAuthority: authority,
    });
    expect(await manageable.authority()).to.equal(authority);
  });

  describe('setAuthority', function () {
    it(`current authority can change manageable's authority`, async function () {
      const manageable = await AccessManageable.new(authority);
      const set = await manageable.setAuthority(other, { from: authority });
      expectEvent(set, 'AuthorityUpdated', {
        sender: authority,
        newAuthority: other,
      });
      expect(await manageable.authority()).to.equal(other);
    });

    it(`other account cannot change manageable's authority`, async function () {
      const manageable = await AccessManageable.new(authority);
      await expectRevert(manageable.setAuthority(other, { from: other }), 'AccessManageable: not current authority');
    });
  });

  describe('restricted', function () {
    const selector = web3.eth.abi.encodeFunctionSignature('restrictedFunction()');

    it('allows if authority returns true', async function () {
      const authority = await SimpleAuthority.new();
      const manageable = await AccessManageable.new(authority.address);
      await authority.setAllowed(user, manageable.address, selector);
      const restricted = await manageable.restrictedFunction({ from: user });
      expectEvent(restricted, 'RestrictedRan');
    });

    it('reverts if authority returns false', async function () {
      const authority = await SimpleAuthority.new();
      const manageable = await AccessManageable.new(authority.address);
      await expectRevert(manageable.restrictedFunction({ from: user }), 'AccessManageable: authority rejected');
    });
  });
});
