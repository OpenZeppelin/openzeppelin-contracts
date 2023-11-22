const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain, domainSeparator, hashTypedData } = require('../../helpers/eip712');
const { getChainId } = require('../../helpers/chainid');

describe('EIP712', function () {
  for (const [shortOrLong, name, version] of [
    ['short', 'A Name', '1'],
    ['long', 'A'.repeat(40), 'B'.repeat(40)],
  ]) {
    describe(`with ${shortOrLong} name and version`, function () {
      const fixture = async () => {
        const [from, to] = await ethers.getSigners();

        const eip712 = await ethers.deployContract('$EIP712Verifier', [name, version]);
        const domain = {
          name,
          version,
          chainId: await getChainId(),
          verifyingContract: eip712.target,
        };

        return { from, to, eip712, domain };
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
          expect(rebuildDomain).to.be.deep.equal(this.domain);
        });

        if (shortOrLong === 'short') {
          // Long strings are in storage, and the proxy will not be properly initialized unless
          // the upgradeable contract variant is used and the initializer is invoked.

          it('adjusts when behind proxy', async function () {
            const factory = await ethers.deployContract('$Clones');

            const clone = await factory
              .$clone(this.eip712)
              .then(tx => tx.wait())
              .then(receipt => receipt.logs[0].args[0])
              .then(address => ethers.getContractAt('$EIP712Verifier', address));

            const expectedDomain = { ...this.domain, verifyingContract: clone.target };
            expect(await getDomain(clone)).to.be.deep.equal(expectedDomain);

            const expectedSeparator = await domainSeparator(expectedDomain);
            expect(await clone.$_domainSeparatorV4()).to.equal(expectedSeparator);
          });
        }
      });

      it('hash digest', async function () {
        const structhash = ethers.hexlify(ethers.randomBytes(32));
        expect(await this.eip712.$_hashTypedDataV4(structhash)).to.be.equal(hashTypedData(this.domain, structhash));
      });

      it('digest', async function () {
        const types = {
          Mail: [
            { name: 'to', type: 'address' },
            { name: 'contents', type: 'string' },
          ],
        };

        const message = {
          to: this.to.address,
          contents: 'very interesting',
        };

        const signature = await this.from.signTypedData(this.domain, types, message);

        await expect(this.eip712.verify(signature, this.from.address, message.to, message.contents)).to.not.be.reverted;
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
