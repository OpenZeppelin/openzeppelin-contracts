const { ethers } = require('hardhat');
const { getDomain, domainType, domainSeparator, hashTypedData } = require('../../helpers/eip712');
const { getChainId } = require('../../helpers/chainid');
const { mapValues } = require('../../helpers/iterate');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('EIP712', function () {
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
      const fixture = async () => {
        const [mailTo] = await ethers.getSigners();

        const eip712 = await ethers.deployContract('$EIP712Verifier', [name, version]);
        const domain = {
          name,
          version,
          chainId: await getChainId(),
          verifyingContract: eip712.target,
        };
        const _domainType = domainType(domain);

        return { mailTo, eip712, domain, domainType: _domainType };
      };

      beforeEach('deploying', async function () {
        Object.assign(this, await loadFixture(fixture));
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
            const factory = await ethers.deployContract('$Clones');
            const cloneAddress = await factory.$clone.staticCall(this.eip712);
            await factory.$clone(this.eip712);
            const clone = await ethers.getContractAt('$EIP712Verifier', cloneAddress);

            const cloneDomain = { ...this.domain, verifyingContract: cloneAddress };

            const reportedDomain = await getDomain(clone);
            expect(mapValues(reportedDomain, String)).to.be.deep.equal(mapValues(cloneDomain, String));

            const expectedSeparator = await domainSeparator(cloneDomain);
            expect(await clone.$_domainSeparatorV4()).to.equal(expectedSeparator);
          });
        }
      });

      it('hash digest', async function () {
        const structhash = ethers.hexlify(ethers.randomBytes(32));
        expect(await this.eip712.$_hashTypedDataV4(structhash)).to.be.equal(hashTypedData(this.domain, structhash));
      });

      it('digest', async function () {
        const message = {
          to: this.mailTo.address,
          contents: 'very interesting',
        };

        const types = {
          Mail: [
            { name: 'to', type: 'address' },
            { name: 'contents', type: 'string' },
          ],
        };

        const signer = ethers.Wallet.createRandom();
        const address = await signer.getAddress();
        const signature = await signer.signTypedData(this.domain, types, message);

        await this.eip712.verify(signature, address, message.to, message.contents);
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
