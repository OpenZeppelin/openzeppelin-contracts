require('openzeppelin-test-helpers');

const { expect } = require('chai');

const AddressImpl = artifacts.require('AddressImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('Address', function ([_, other]) {
  beforeEach(async function () {
    this.mock = await AddressImpl.new();
  });

  it('should return false for account address', async function () {
    expect(await this.mock.isContract(other)).to.equal(false);
  });

  it('should return true for contract address', async function () {
    const contract = await SimpleToken.new();
    expect(await this.mock.isContract(contract.address)).to.equal(true);
  });
});
