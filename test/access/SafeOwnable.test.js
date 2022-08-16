const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const SafeOwnable = artifacts.require('SafeOwnableMock');

contract('SafeOwnable', function (accounts) {
  const [ owner, accountA, accountB ] = accounts;

  beforeEach(async function () {
    this.safeOwnable = await SafeOwnable.new({ from: owner });
  });

  describe('transfer ownership', function () {
    it('starting a transfer does not change owner', async function () {
      const receipt = await this.safeOwnable.transferOwnership(accountA, { from: owner });
      expectEvent(receipt, 'OwnershipTransferStarted');
      expect(await this.safeOwnable.owner()).to.equal(owner);
    });

    it('changes owner after transfer', async function () {
      await this.safeOwnable.transferOwnership(accountA, { from: owner });
      const receipt = await this.safeOwnable.acceptOwnership({ from: accountA });
      expectEvent(receipt, 'OwnershipTransferred');
      expect(await this.safeOwnable.owner()).to.equal(accountA);
    });

    it('guards transfer against invalid user', async function () {
      await this.safeOwnable.transferOwnership(accountA, { from: owner });
      await expectRevert(
        this.safeOwnable.acceptOwnership({ from: accountB }),
        'SafeOwnable: caller is not the new owner',
      );
    });

    it('guards ownership against stuck state', async function () {
      await expectRevert(
        this.safeOwnable.transferOwnership(ZERO_ADDRESS, { from: owner }),
        'SafeOwnable: new owner is the zero address',
      );
    });
  });
});
