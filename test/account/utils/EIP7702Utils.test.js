import { network } from 'hardhat';
import { expect } from 'chai';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

const fixture = async () => {
  const [eoa, relayer] = await ethers.getSigners();
  const mock = await ethers.deployContract('$EIP7702Utils');
  return { eoa, relayer, mock };
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
      await this.eoa
        .authorize({ address: this.mock })
        .then(authorization =>
          this.relayer.sendTransaction({ to: ethers.ZeroAddress, authorizationList: [authorization] }),
        );

      await expect(this.mock.$fetchDelegate(this.eoa)).to.eventually.equal(this.mock);
    });

    it('EOA with revoked delegation', async function () {
      // set delegation
      await this.eoa
        .authorize({ address: this.mock })
        .then(authorization =>
          this.relayer.sendTransaction({ to: ethers.ZeroAddress, authorizationList: [authorization] }),
        );
      // reset delegation
      await this.eoa
        .authorize({ address: ethers.ZeroAddress })
        .then(authorization =>
          this.relayer.sendTransaction({ to: ethers.ZeroAddress, authorizationList: [authorization] }),
        );

      await expect(this.mock.$fetchDelegate(this.eoa)).to.eventually.equal(ethers.ZeroAddress);
    });

    it('other smart contract', async function () {
      await expect(this.mock.$fetchDelegate(this.mock)).to.eventually.equal(ethers.ZeroAddress);
    });
  });
});
