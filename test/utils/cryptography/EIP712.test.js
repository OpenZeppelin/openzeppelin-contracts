const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const { getDomain, domainType, domainSeparator, hashTypedData } = require('../../helpers/eip712');
const { getChainId } = require('../../helpers/chainid');
const { mapValues } = require('../../helpers/iterate');

const EIP712Verifier = artifacts.require('$EIP712Verifier');
const Clones = artifacts.require('$Clones');

contract('EIP712', function (accounts) {
  const [mailTo] = accounts;

  const shortName = 'A Name';
  const shortVersion = '1';

  const longName = 'A'.repeat(40);
  const longVersion = 'B'.repeat(40);

  const cases = [
    ['short', shortName, shortVersion],
    ['long', longName, longVersion],
  ];

  for (const [shortOrLong, name, version] of cases) {
    describe(`with ${shortOrLong} name and version`, function () {
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

        if (shortOrLong === 'short') {
          // Long strings are in storage, and the proxy will not be properly initialized unless
          // the upgradeable contract variant is used and the initializer is invoked.

          it('adjusts when behind proxy', async function () {
            const factory = await Clones.new();
            const cloneReceipt = await factory.$clone(this.eip712.address);
            const cloneAddress = cloneReceipt.logs.find(({ event }) => event === 'return$clone').args.instance;
            const clone = new EIP712Verifier(cloneAddress);

            const cloneDomain = { ...this.domain, verifyingContract: clone.address };

            const reportedDomain = await getDomain(clone);
            expect(mapValues(reportedDomain, String)).to.be.deep.equal(mapValues(cloneDomain, String));

            const expectedSeparator = await domainSeparator(cloneDomain);
            expect(await clone.$_domainSeparatorV4()).to.equal(expectedSeparator);
          });
        }
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

      it('name', async function () {
        expect(await this.eip712.$_EIP712Name()).to.be.equal(name);
      });

      it('version', async function () {
        expect(await this.eip712.$_EIP712Version()).to.be.equal(version);
      });
    });
  }
});
