const { constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const AddressImpl = artifacts.require('AddressImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('Address', function ([_, other]) {
  const ALL_ONES_ADDRESS = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF';

  beforeEach(async function () {
    this.mock = await AddressImpl.new();
  });

  describe('isContract', function () {
    it('should return false for account address', async function () {
      expect(await this.mock.isContract(other)).to.equal(false);
    });

    it('should return true for contract address', async function () {
      const contract = await SimpleToken.new();
      expect(await this.mock.isContract(contract.address)).to.equal(true);
    });
  });

  describe('toPayable', function () {
    it('should return a payable address when the account is the zero address', async function () {
      expect(await this.mock.toPayable(constants.ZERO_ADDRESS)).to.equal(constants.ZERO_ADDRESS);
    });

    it('should return a payable address when the account is an arbitrary address', async function () {
      expect(await this.mock.toPayable(other)).to.equal(other);
    });

    it('should return a payable address when the account is the all ones address', async function () {
      expect(await this.mock.toPayable(ALL_ONES_ADDRESS)).to.equal(ALL_ONES_ADDRESS);
    });
  });
});
