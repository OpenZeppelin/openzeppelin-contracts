const AddressImpl = artifacts.require('AddressImpl');
const SimpleToken = artifacts.require('SimpleToken');

require('../helpers/setup');

contract('Address', function ([_, anyone]) {
  beforeEach(async function () {
    this.mock = await AddressImpl.new();
  });

  it('should return false for account address', async function () {
    (await this.mock.isContract(anyone)).should.equal(false);
  });

  it('should return true for contract address', async function () {
    const contract = await SimpleToken.new();
    (await this.mock.isContract(contract.address)).should.equal(true);
  });
});
