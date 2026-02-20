const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const setDelegation = (account, target, relayer = account) =>
  account
    .getNonce()
    .then(nonce =>
      account.authorize({
        address: target,
        nonce: nonce + (relayer?.address == account.address ? 1 : 0),
      }),
    )
    .then(authorization =>
      relayer.sendTransaction({
        to: ethers.ZeroAddress,
        authorizationList: [authorization],
      }),
    );

const fixture = async () => {
  const [eoa] = await ethers.getSigners();
  const mock = await ethers.deployContract('$EIP7702Utils');
  return { eoa, mock };
};

describe('EIP7702Utils', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('fetchDelegate', function () {
    it('EOA without delegation', async function () {
      await expect(this.mock.$fetchDelegate(this.eoa)).to.eventually.equal(ethers.ZeroAddress);
    });

    it('EOA with delegation', async function () {
      // set delegation
      await setDelegation(this.eoa, this.mock);

      await expect(this.mock.$fetchDelegate(this.eoa)).to.eventually.equal(this.mock);
    });

    it('EOA with revoked delegation', async function () {
      // set delegation
      await setDelegation(this.eoa, this.mock);
      // reset delegation
      await setDelegation(this.eoa, ethers.ZeroAddress);

      await expect(this.mock.$fetchDelegate(this.eoa)).to.eventually.equal(ethers.ZeroAddress);
    });

    it('other smart contract', async function () {
      await expect(this.mock.$fetchDelegate(this.mock)).to.eventually.equal(ethers.ZeroAddress);
    });
  });
});
