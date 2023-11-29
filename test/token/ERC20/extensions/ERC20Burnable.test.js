const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC20Burnable } = require('./ERC20Burnable.behavior');

async function fixture() {
  const [owner, burner] = await ethers.getSigners();

  const initialBalance = 1000n;

  const name = 'My Token';
  const symbol = 'MTKN';

  const token = await ethers.deployContract('$ERC20Burnable', [name, symbol], owner);
  await token.$_mint(owner, initialBalance);

  return { owner, burner, initialBalance, name, symbol, token };
}

describe('ERC20Burnable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC20Burnable();
});
