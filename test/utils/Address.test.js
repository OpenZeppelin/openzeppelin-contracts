const AddressImpl = artifacts.require('AddressImpl');
const SimpleToken = artifacts.require('SimpleToken');

require('chai')
  .should();

contract('Address', function ([_, anyone]) {
  beforeEach(async function () {
    this.mock = await AddressImpl.new();
  });

  describe('with account address', function () {
    it('should return false', async function () {
      (await this.mock.isInitializedContract(anyone)).should.equal(false);
    });
  });

  describe('with contract address', function () {
    it('should return true', async function () {
      const contract = await SimpleToken.new();
      (await this.mock.isInitializedContract(contract.address)).should.equal(true);
    });
  });
});
