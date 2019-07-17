require('openzeppelin-test-helpers');

const AddressImpl = artifacts.require('AddressImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('Address', function ([_, other]) {
  beforeEach(async function () {
    this.mock = await AddressImpl.new();
  });

  it('should return false for account address', async function () {
    (await this.mock.isContract(other)).should.equal(false);
  });

  it('should return true for contract address', async function () {
    const contract = await SimpleToken.new();
    (await this.mock.isContract(contract.address)).should.equal(true);
  });
});
