const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const { getDomain, domainType, domainSeparator, hashTypedData } = require('../../helpers/eip712');
const { getChainId } = require('../../helpers/chainid');
const { mapValues } = require('../../helpers/map-values');

const EIP712Verifier = artifacts.require('$EIP712Verifier');

contract('EIP712', function (accounts) {
  const [mailTo] = accounts;

  const name = 'A Name';
  const version = '1';

  beforeEach('deploying', async function () {
    this.eip712 = await EIP712Verifier.new(name, version);

    this.domain = {
      name,
      version,
      chainId: await getChainId(),
      verifyingContract: this.eip712.address,
    };
    this.domainType = domainType(this.domain);
  });

  describe('domain separator', function () {
    it('is internally available', async function () {
      const expected = await domainSeparator(this.domain);

      expect(await this.eip712.$_domainSeparatorV4()).to.equal(expected);
    });

    it("can be rebuilt using EIP-5267's eip712Domain", async function () {
      const rebuildDomain = await getDomain(this.eip712);
      expect(mapValues(rebuildDomain, String)).to.be.deep.equal(mapValues(this.domain, String));
    });
  });

  it('hash digest', async function () {
    const structhash = web3.utils.randomHex(32);
    expect(await this.eip712.$_hashTypedDataV4(structhash)).to.be.equal(hashTypedData(this.domain, structhash));
  });

  it('digest', async function () {
    const message = {
      to: mailTo,
      contents: 'very interesting',
    };

    const data = {
      types: {
        EIP712Domain: this.domainType,
        Mail: [
          { name: 'to', type: 'address' },
          { name: 'contents', type: 'string' },
        ],
      },
      domain: this.domain,
      primaryType: 'Mail',
      message,
    };

    const wallet = Wallet.generate();
    const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });

    await this.eip712.verify(signature, wallet.getAddressString(), message.to, message.contents);
  });
});
