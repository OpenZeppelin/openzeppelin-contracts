const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC20Burnable } = require('./ERC20Burnable.behavior');

const name = 'My Token';
const symbol = 'MTKN';
const initialBalance = 1000n;

async function fixture() {
  const [owner, burner] = await ethers.getSigners();

  const token = await ethers.deployContract('$ERC20Burnable', [name, symbol], owner);
  await token.$_mint(owner, initialBalance);

  return { owner, burner, token, initialBalance };
}

describe('ERC20Burnable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC20Burnable();
});
