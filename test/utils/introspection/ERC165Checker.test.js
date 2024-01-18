const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const DUMMY_ID = '0xdeadbeef';
const DUMMY_ID_2 = '0xcafebabe';
const DUMMY_ID_3 = '0xdecafbad';
const DUMMY_UNSUPPORTED_ID = '0xbaddcafe';
const DUMMY_UNSUPPORTED_ID_2 = '0xbaadcafe';
const DUMMY_ACCOUNT = '0x1111111111111111111111111111111111111111';

async function fixture() {
  return { mock: await ethers.deployContract('$ERC165Checker') };
}

describe('ERC165Checker', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('ERC165 missing return data', function () {
    before(async function () {
      this.target = await ethers.deployContract('ERC165MissingData');
    });

    it('does not support ERC165', async function () {
      expect(await this.mock.$supportsERC165(this.target)).to.be.false;
    });

    it('does not support mock interface via supportsInterface', async function () {
      expect(await this.mock.$supportsInterface(this.target, DUMMY_ID)).to.be.false;
    });

    it('does not support mock interface via supportsAllInterfaces', async function () {
      expect(await this.mock.$supportsAllInterfaces(this.target, [DUMMY_ID])).to.be.false;
    });

    it('does not support mock interface via getSupportedInterfaces', async function () {
      expect(await this.mock.$getSupportedInterfaces(this.target, [DUMMY_ID])).to.deep.equal([false]);
    });

    it('does not support mock interface via supportsERC165InterfaceUnchecked', async function () {
      expect(await this.mock.$supportsERC165InterfaceUnchecked(this.target, DUMMY_ID)).to.be.false;
    });
  });

  describe('ERC165 malicious return data', function () {
    beforeEach(async function () {
      this.target = await ethers.deployContract('ERC165MaliciousData');
    });

    it('does not support ERC165', async function () {
      expect(await this.mock.$supportsERC165(this.target)).to.be.false;
    });

    it('does not support mock interface via supportsInterface', async function () {
      expect(await this.mock.$supportsInterface(this.target, DUMMY_ID)).to.be.false;
    });

    it('does not support mock interface via supportsAllInterfaces', async function () {
      expect(await this.mock.$supportsAllInterfaces(this.target, [DUMMY_ID])).to.be.false;
    });

    it('does not support mock interface via getSupportedInterfaces', async function () {
      expect(await this.mock.$getSupportedInterfaces(this.target, [DUMMY_ID])).to.deep.equal([false]);
    });

    it('does not support mock interface via supportsERC165InterfaceUnchecked', async function () {
      expect(await this.mock.$supportsERC165InterfaceUnchecked(this.target, DUMMY_ID)).to.be.true;
    });
  });

  describe('ERC165 not supported', function () {
    beforeEach(async function () {
      this.target = await ethers.deployContract('ERC165NotSupported');
    });

    it('does not support ERC165', async function () {
      expect(await this.mock.$supportsERC165(this.target)).to.be.false;
    });

    it('does not support mock interface via supportsInterface', async function () {
      expect(await this.mock.$supportsInterface(this.target, DUMMY_ID)).to.be.false;
    });

    it('does not support mock interface via supportsAllInterfaces', async function () {
      expect(await this.mock.$supportsAllInterfaces(this.target, [DUMMY_ID])).to.be.false;
    });

    it('does not support mock interface via getSupportedInterfaces', async function () {
      expect(await this.mock.$getSupportedInterfaces(this.target, [DUMMY_ID])).to.deep.equal([false]);
    });

    it('does not support mock interface via supportsERC165InterfaceUnchecked', async function () {
      expect(await this.mock.$supportsERC165InterfaceUnchecked(this.target, DUMMY_ID)).to.be.false;
    });
  });

  describe('ERC165 supported', function () {
    beforeEach(async function () {
      this.target = await ethers.deployContract('ERC165InterfacesSupported', [[]]);
    });

    it('supports ERC165', async function () {
      expect(await this.mock.$supportsERC165(this.target)).to.be.true;
    });

    it('does not support mock interface via supportsInterface', async function () {
      expect(await this.mock.$supportsInterface(this.target, DUMMY_ID)).to.be.false;
    });

    it('does not support mock interface via supportsAllInterfaces', async function () {
      expect(await this.mock.$supportsAllInterfaces(this.target, [DUMMY_ID])).to.be.false;
    });

    it('does not support mock interface via getSupportedInterfaces', async function () {
      expect(await this.mock.$getSupportedInterfaces(this.target, [DUMMY_ID])).to.deep.equal([false]);
    });

    it('does not support mock interface via supportsERC165InterfaceUnchecked', async function () {
      expect(await this.mock.$supportsERC165InterfaceUnchecked(this.target, DUMMY_ID)).to.be.false;
    });
  });

  describe('ERC165 and single interface supported', function () {
    beforeEach(async function () {
      this.target = await ethers.deployContract('ERC165InterfacesSupported', [[DUMMY_ID]]);
    });

    it('supports ERC165', async function () {
      expect(await this.mock.$supportsERC165(this.target)).to.be.true;
    });

    it('supports mock interface via supportsInterface', async function () {
      expect(await this.mock.$supportsInterface(this.target, DUMMY_ID)).to.be.true;
    });

    it('supports mock interface via supportsAllInterfaces', async function () {
      expect(await this.mock.$supportsAllInterfaces(this.target, [DUMMY_ID])).to.be.true;
    });

    it('supports mock interface via getSupportedInterfaces', async function () {
      expect(await this.mock.$getSupportedInterfaces(this.target, [DUMMY_ID])).to.deep.equal([true]);
    });

    it('supports mock interface via supportsERC165InterfaceUnchecked', async function () {
      expect(await this.mock.$supportsERC165InterfaceUnchecked(this.target, DUMMY_ID)).to.be.true;
    });
  });

  describe('ERC165 and many interfaces supported', function () {
    const supportedInterfaces = [DUMMY_ID, DUMMY_ID_2, DUMMY_ID_3];
    beforeEach(async function () {
      this.target = await ethers.deployContract('ERC165InterfacesSupported', [supportedInterfaces]);
    });

    it('supports ERC165', async function () {
      expect(await this.mock.$supportsERC165(this.target)).to.be.true;
    });

    it('supports each interfaceId via supportsInterface', async function () {
      for (const interfaceId of supportedInterfaces) {
        expect(await this.mock.$supportsInterface(this.target, interfaceId)).to.be.true;
      }
    });

    it('supports all interfaceIds via supportsAllInterfaces', async function () {
      expect(await this.mock.$supportsAllInterfaces(this.target, supportedInterfaces)).to.be.true;
    });

    it('supports none of the interfaces queried via supportsAllInterfaces', async function () {
      const interfaceIdsToTest = [DUMMY_UNSUPPORTED_ID, DUMMY_UNSUPPORTED_ID_2];

      expect(await this.mock.$supportsAllInterfaces(this.target, interfaceIdsToTest)).to.be.false;
    });

    it('supports not all of the interfaces queried via supportsAllInterfaces', async function () {
      const interfaceIdsToTest = [...supportedInterfaces, DUMMY_UNSUPPORTED_ID];
      expect(await this.mock.$supportsAllInterfaces(this.target, interfaceIdsToTest)).to.be.false;
    });

    it('supports all interfaceIds via getSupportedInterfaces', async function () {
      expect(await this.mock.$getSupportedInterfaces(this.target, supportedInterfaces)).to.deep.equal(
        supportedInterfaces.map(i => supportedInterfaces.includes(i)),
      );
    });

    it('supports none of the interfaces queried via getSupportedInterfaces', async function () {
      const interfaceIdsToTest = [DUMMY_UNSUPPORTED_ID, DUMMY_UNSUPPORTED_ID_2];

      expect(await this.mock.$getSupportedInterfaces(this.target, interfaceIdsToTest)).to.deep.equal(
        interfaceIdsToTest.map(i => supportedInterfaces.includes(i)),
      );
    });

    it('supports not all of the interfaces queried via getSupportedInterfaces', async function () {
      const interfaceIdsToTest = [...supportedInterfaces, DUMMY_UNSUPPORTED_ID];

      expect(await this.mock.$getSupportedInterfaces(this.target, interfaceIdsToTest)).to.deep.equal(
        interfaceIdsToTest.map(i => supportedInterfaces.includes(i)),
      );
    });

    it('supports each interfaceId via supportsERC165InterfaceUnchecked', async function () {
      for (const interfaceId of supportedInterfaces) {
        expect(await this.mock.$supportsERC165InterfaceUnchecked(this.target, interfaceId)).to.be.true;
      }
    });
  });

  describe('account address does not support ERC165', function () {
    it('does not support ERC165', async function () {
      expect(await this.mock.$supportsERC165(DUMMY_ACCOUNT)).to.be.false;
    });

    it('does not support mock interface via supportsInterface', async function () {
      expect(await this.mock.$supportsInterface(DUMMY_ACCOUNT, DUMMY_ID)).to.be.false;
    });

    it('does not support mock interface via supportsAllInterfaces', async function () {
      expect(await this.mock.$supportsAllInterfaces(DUMMY_ACCOUNT, [DUMMY_ID])).to.be.false;
    });

    it('does not support mock interface via getSupportedInterfaces', async function () {
      expect(await this.mock.$getSupportedInterfaces(DUMMY_ACCOUNT, [DUMMY_ID])).to.deep.equal([false]);
    });

    it('does not support mock interface via supportsERC165InterfaceUnchecked', async function () {
      expect(await this.mock.$supportsERC165InterfaceUnchecked(DUMMY_ACCOUNT, DUMMY_ID)).to.be.false;
    });
  });

  it('Return bomb resistance', async function () {
    this.target = await ethers.deployContract('ERC165ReturnBombMock');

    const { gasUsed: gasUsed1 } = await this.mock.$supportsInterface.send(this.target, DUMMY_ID).then(tx => tx.wait());
    expect(gasUsed1).to.be.lessThan(120_000n); // 3*30k + 21k + some margin

    const { gasUsed: gasUsed2 } = await this.mock.$getSupportedInterfaces
      .send(this.target, [DUMMY_ID, DUMMY_ID_2, DUMMY_ID_3, DUMMY_UNSUPPORTED_ID, DUMMY_UNSUPPORTED_ID_2])
      .then(tx => tx.wait());

    expect(gasUsed2).to.be.lessThan(250_000n); // (2+5)*30k + 21k + some margin
  });
});
