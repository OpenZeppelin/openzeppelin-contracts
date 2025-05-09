const { ethers } = require('hardhat');
const { shouldBehaveLikeERC1271 } = require('./ERC1271.behavior');

describe('ERC7739', function () {
  describe('for an ECDSA signer', function () {
    before(async function () {
      this.signer = ethers.Wallet.createRandom();
      this.mock = await ethers.deployContract('ERC7739ECDSAMock', [this.signer.address]);
    });

    shouldBehaveLikeERC1271({ erc7739: true });
  });
});
