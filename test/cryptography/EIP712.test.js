const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const EIP712 = artifacts.require('EIP712External');

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

async function domainSeparator (name, version, chainId, verifyingContract) {
  return '0x' + ethSigUtil.TypedDataUtils.hashStruct(
    'EIP712Domain',
    { name, version, chainId, verifyingContract },
    { EIP712Domain },
  ).toString('hex');
}

contract('EIP712', function (accounts) {
  const [mailTo] = accounts;

  const name = 'A Name';
  const version = '1';

  beforeEach('deploying', async function () {
    this.eip712 = await EIP712.new(name, version);

    // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
    // from within the EVM as from the JSON RPC interface.
    // See https://github.com/trufflesuite/ganache-core/issues/515
    this.chainId = await this.eip712.getChainId();
  });

  it('domain separator', async function () {
    expect(
      await this.eip712.domainSeparator(),
    ).to.equal(
      await domainSeparator(name, version, this.chainId, this.eip712.address),
    );
  });

  it('digest', async function () {
    const chainId = this.chainId;
    const verifyingContract = this.eip712.address;
    const message = {
      to: mailTo,
      contents: 'very interesting',
    };

    const data = {
      types: {
        EIP712Domain,
        Mail: [
          { name: 'to', type: 'address' },
          { name: 'contents', type: 'string' },
        ],
      },
      domain: { name, version, chainId, verifyingContract },
      primaryType: 'Mail',
      message,
    };

    const wallet = Wallet.generate();
    const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });

    await this.eip712.verify(signature, wallet.getAddressString(), message.to, message.contents);
  });
});
