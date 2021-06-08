const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const { EIP712Domain, domainSeparator } = require('../../helpers/eip712');
const { getChainId } = require('../../helpers/chainid');

const EIP712 = artifacts.require('EIP712External');

contract('EIP712', function (accounts) {
  const [mailTo] = accounts;

  const name = 'A Name';
  const version = '1';

  beforeEach('deploying', async function () {
    this.eip712 = await EIP712.new(name, version);
  });

  it('domain separator', async function () {
    expect(
      await this.eip712.domainSeparator(),
    ).to.equal(
      await domainSeparator(name, version, await getChainId(), this.eip712.address),
    );
  });

  it('digest', async function () {
    const chainId = await getChainId();
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
