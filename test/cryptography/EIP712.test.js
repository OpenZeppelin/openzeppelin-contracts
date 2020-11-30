const ethSigUtil = require('eth-sig-util');

const EIP712 = artifacts.require('EIP712External');

async function domainSeparator (name, version, chainId, verifyingContract, salt) {
  const EIP712Domain = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ];
  if (salt !== undefined) {
    EIP712Domain.push({ name: 'salt', type: 'bytes32' });
  }

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

    // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
    // from within the EVM as from the JSON RPC interface.
    // See https://github.com/trufflesuite/ganache-core/issues/515
    this.chainId = await this.eip712.getChainId();
  });

  it('unsalted domain separator', async function () {
    expect(
      await this.eip712.domainSeparator(),
    ).to.equal(
      await domainSeparator(name, version, this.chainId, this.eip712.address),
    );
  });

  it('salted domain separator', async function () {
    const salt = '0x1234';
    expect(
      await this.eip712.domainSeparator(salt),
    ).to.equal(
      await domainSeparator(name, version, this.chainId, this.eip712.address, salt),
    );
  });
});
