const { accounts, contract } = require('@openzeppelin/test-environment');

const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const SecondaryMock = contract.fromArtifact('SecondaryMock');

describe('Secondary', function () {
  const [ primary, newPrimary, other ] = accounts;

  beforeEach(async function () {
    this.secondary = await SecondaryMock.new({ from: primary });
  });

  it('stores the primary\'s address', async function () {
    expect(await this.secondary.primary()).to.equal(primary);
  });

  describe('onlyPrimary', function () {
    it('allows the primary account to call onlyPrimary functions', async function () {
      await this.secondary.onlyPrimaryMock({ from: primary });
    });

    it('reverts when anyone calls onlyPrimary functions', async function () {
      await expectRevert(this.secondary.onlyPrimaryMock({ from: other }),
        'Secondary: caller is not the primary account'
      );
    });
  });

  describe('transferPrimary', function () {
    it('makes the recipient the new primary', async function () {
      const { logs } = await this.secondary.transferPrimary(newPrimary, { from: primary });
      expectEvent.inLogs(logs, 'PrimaryTransferred', { recipient: newPrimary });
      expect(await this.secondary.primary()).to.equal(newPrimary);
    });

    it('reverts when transferring to the null address', async function () {
      await expectRevert(this.secondary.transferPrimary(ZERO_ADDRESS, { from: primary }),
        'Secondary: new primary is the zero address'
      );
    });

    it('reverts when called by anyone', async function () {
      await expectRevert(this.secondary.transferPrimary(newPrimary, { from: other }),
        'Secondary: caller is not the primary account'
      );
    });

    context('with new primary', function () {
      beforeEach(async function () {
        await this.secondary.transferPrimary(newPrimary, { from: primary });
      });

      it('allows the new primary account to call onlyPrimary functions', async function () {
        await this.secondary.onlyPrimaryMock({ from: newPrimary });
      });

      it('reverts when the old primary account calls onlyPrimary functions', async function () {
        await expectRevert(this.secondary.onlyPrimaryMock({ from: primary }),
          'Secondary: caller is not the primary account'
        );
      });
    });
  });
});
