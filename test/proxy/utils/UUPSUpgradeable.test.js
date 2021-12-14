const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const ERC1967Proxy = artifacts.require('ERC1967Proxy');
const UUPSUpgradeableMock = artifacts.require('UUPSUpgradeableMock');
const UUPSUpgradeableUnsafeMock = artifacts.require('UUPSUpgradeableUnsafeMock');
const UUPSUpgradeableBrokenMock = artifacts.require('UUPSUpgradeableBrokenMock');
const CountersImpl = artifacts.require('CountersImpl');

const Legacy = [ './legacy/UUPSUpgradeableMockV1' ];

contract('UUPSUpgradeable', function (accounts) {
  before(async function () {
    this.implInitial = await UUPSUpgradeableMock.new();
    this.implUpgradeOk = await UUPSUpgradeableMock.new();
    this.implUpgradeUnsafe = await UUPSUpgradeableUnsafeMock.new();
    this.implUpgradeBroken = await UUPSUpgradeableBrokenMock.new();
    this.implUpgradeNonUUPS = await CountersImpl.new();
  });

  beforeEach(async function () {
    const { address } = await ERC1967Proxy.new(this.implInitial.address, '0x');
    this.instance = await UUPSUpgradeableMock.at(address);
  });

  it('upgrade to upgradeable implementation', async function () {
    const { receipt } = await this.instance.upgradeTo(this.implUpgradeOk.address);
    expect(receipt.logs.filter(({ event }) => event === 'Upgraded').length).to.be.equal(1);
    expectEvent(receipt, 'Upgraded', { implementation: this.implUpgradeOk.address });
  });

  it('upgrade to upgradeable implementation with call', async function () {
    expect(await this.instance.current()).to.be.bignumber.equal('0');

    const { receipt } = await this.instance.upgradeToAndCall(
      this.implUpgradeOk.address,
      this.implUpgradeOk.contract.methods.increment().encodeABI(),
    );
    expect(receipt.logs.filter(({ event }) => event === 'Upgraded').length).to.be.equal(1);
    expectEvent(receipt, 'Upgraded', { implementation: this.implUpgradeOk.address });

    expect(await this.instance.current()).to.be.bignumber.equal('1');
  });

  it('upgrade to and unsafe upgradeable implementation', async function () {
    const { receipt } = await this.instance.upgradeTo(this.implUpgradeUnsafe.address);
    expectEvent(receipt, 'Upgraded', { implementation: this.implUpgradeUnsafe.address });
  });

  it.skip('reject upgrade to broken upgradeable implementation (no longer supported)', async function () {
    await expectRevert(
      this.instance.upgradeTo(this.implUpgradeBroken.address),
      'ERC1967Upgrade: upgrade breaks further upgrades',
    );
  });

  // delegate to a non existing upgradeTo function causes a low level revert
  it('reject upgrade to non uups implementation', async function () {
    await expectRevert(
      this.instance.upgradeTo(this.implUpgradeNonUUPS.address),
      'Transaction reverted: function selector was not recognized and there\'s no fallback function',
    );
  });

  it('reject proxy address as implementation', async function () {
    const { address } = await ERC1967Proxy.new(this.implInitial.address, '0x');
    const otherInstance = await UUPSUpgradeableMock.at(address);

    // infinite loop reverts when a nested call is out-of-gas
    await expectRevert(
      this.instance.upgradeTo(otherInstance.address),
      'Function must not be called through delegatecall',
    );
  });

  describe(`compatibility with legacy version of UUPSUpgradeable`, function () {
    // This could possibly be cleaner/simpler with ethers.js
    for (const path of Legacy) {
      it(`can upgrade from ${path}`, async function () {
        const artefact = require(path);
        // deploy legacy implementation
        const legacy = new web3.eth.Contract(artefact.abi);
        const { _address: implAddr } = await legacy.deploy({ data: artefact.bytecode }).send({ from: accounts[0] });

        // deploy proxy
        const { address: proxyAddr } = await ERC1967Proxy.new(implAddr, '0x');
        const proxy = new web3.eth.Contract(artefact.abi, proxyAddr);

        // perform upgrade
        const receipt = await proxy.methods.upgradeTo(this.implInitial.address).send({ from: accounts[0] });
        expectEvent(receipt, 'Upgraded', { implementation: this.implInitial.address });
      });
    }
  });
});
