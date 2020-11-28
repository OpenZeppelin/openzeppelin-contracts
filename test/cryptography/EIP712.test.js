const ethSigUtil = require('eth-sig-util');

const EIP712 = artifacts.require('EIP712External');

async function domainSeparator (name, version, verifyingContract, salt) {
  const EIP712Domain = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ];
  if (salt !== undefined) {
    EIP712Domain.push({ name: 'salt', type: 'bytes32' });
  }

  const chainId = await web3.eth.getChainId();

  return '0x' + ethSigUtil.TypedDataUtils.hashStruct(
    'EIP712Domain',
    { name, version, chainId, verifyingContract, salt },
    { EIP712Domain },
  ).toString('hex');
}

contract('EIP712', function (accounts) {
  const name = 'A Name';
  const version = '1';

  beforeEach('deploying', async function () {
    this.eip712 = await EIP712.new(name, version);
  });

  it('unsalted domain separator', async function () {
    expect(
      await this.eip712.domainSeparator(),
    ).to.equal(
      await domainSeparator(name, version, this.eip712.address),
    );
  });

  it('salted domain separator', async function () {
    const salt = '0x1234';
    expect(
      await this.eip712.domainSeparator(salt),
    ).to.equal(
      await domainSeparator(name, version, this.eip712.address, salt),
    );
  });
});
