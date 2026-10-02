import { network } from 'hardhat';
import { expect } from 'chai';
import { getDomain, domainSeparator, hashTypedData } from '../../helpers/eip712';
import { formatType } from '../../helpers/eip712-types';
import * as random from '../../helpers/random';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

const name = 'A Name';
const version = '1';

const fixture = async () => {
  const [from, to] = await ethers.getSigners();

  const eip712 = await ethers.deployContract('$EIP712Verifier', [name, version]);
  const domain = await ethers.provider.getNetwork().then(({ chainId }) => ({
    name,
    version,
    chainId,
    verifyingContract: eip712.target,
  }));

  return { from, to, eip712, domain };
};

describe('EIP712', function () {
  beforeEach('deploying', async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('with short name and version', function () {
    describe('domain separator', function () {
      it('is internally available', async function () {
        const expected = await domainSeparator(this.domain);

        await expect(this.eip712.$_domainSeparatorV4()).to.eventually.equal(expected);
      });

      it("can be rebuilt using EIP-5267's eip712Domain", async function () {
        const rebuildDomain = await getDomain(this.eip712);
        expect(rebuildDomain).to.be.deep.equal(this.domain);
      });

      it('adjusts when behind proxy', async function () {
        const factory = await ethers.deployContract('$Clones');

        const clone = await factory
          .$clone(this.eip712)
          .then(tx => tx.wait())
          .then(receipt => receipt.logs.find(ev => ev.fragment.name == 'return$clone_address').args.instance)
          .then(address => ethers.getContractAt('$EIP712Verifier', address));

        const expectedDomain = { ...this.domain, verifyingContract: clone.target };
        await expect(getDomain(clone)).to.eventually.deep.equal(expectedDomain);

        const expectedSeparator = await domainSeparator(expectedDomain);
        await expect(clone.$_domainSeparatorV4()).to.eventually.equal(expectedSeparator);
      });
    });

    it('hash digest', async function () {
      const structhash = random.bytes32();
      await expect(this.eip712.$_hashTypedDataV4(structhash)).to.eventually.equal(
        hashTypedData(this.domain, structhash),
      );
    });

    it('digest', async function () {
      const types = {
        Mail: formatType({
          to: 'address',
          contents: 'string',
        }),
      };

      const message = {
        to: this.to.address,
        contents: 'very interesting',
      };

      const signature = await this.from.signTypedData(this.domain, types, message);

      await expect(this.eip712.verify(signature, this.from.address, message.to, message.contents)).to.be.not.revert(
        ethers,
      );
    });

    it('name', async function () {
      await expect(this.eip712.$_EIP712Name()).to.eventually.equal(name);
    });

    it('version', async function () {
      await expect(this.eip712.$_EIP712Version()).to.eventually.equal(version);
    });
  });

  describe('with long name and version', function () {
    it('deployment fails with long name', async function () {
      const longName = 'A'.repeat(32);
      await expect(ethers.deployContract('$EIP712Verifier', [longName, version]))
        .to.be.revertedWithCustomError(this.eip712, 'StringTooLong')
        .withArgs(longName);
    });

    it('deployment fails with long version', async function () {
      const longVersion = 'B'.repeat(32);
      await expect(ethers.deployContract('$EIP712Verifier', [name, longVersion]))
        .to.be.revertedWithCustomError(this.eip712, 'StringTooLong')
        .withArgs(longVersion);
    });
  });
});
