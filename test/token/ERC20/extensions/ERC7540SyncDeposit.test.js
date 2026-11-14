import { network } from 'hardhat';
import { expect } from 'chai';
import { shouldBehaveLikeERC4626Deposit } from './ERC4626.behavior';
import { shouldBehaveLikeERC7540Operator, shouldBehaveLikeERC7540Redeem } from './ERC7540.behavior';
import { shouldBehaveLikeERC7575 } from './ERC7575.behavior';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

const name = 'Vault Shares';
const symbol = 'vSHR';
const tokenName = 'Asset Token';
const tokenSymbol = 'AST';

async function fixture() {
  const token = await ethers.deployContract('$ERC20', [tokenName, tokenSymbol]);
  const mock = await ethers.deployContract('$ERC7540SyncDepositMock', [name, symbol, token]);
  return { token, mock };
}

describe('ERC7540SyncDeposit', function () {
  before(function () {
    this.ethers = ethers;
  });

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));

    this.getRequestId = () => 0n;
    this.fulfillDeposit = () => {
      throw new Error('deposit is synchronous');
    };
    this.fulfillRedeem = (requestId, assets, shares, controller) =>
      this.mock.$_fulfillRedeem(shares, assets, controller);
  });

  describe('metadata', function () {
    it('token', async function () {
      await expect(this.mock.asset()).to.eventually.equal(this.token);
    });

    it('name, symbol, decimals', async function () {
      await expect(this.mock.name()).to.eventually.equal(name);
      await expect(this.mock.symbol()).to.eventually.equal(symbol);
      await expect(this.mock.decimals()).to.eventually.equal(18n);
    });

    it('reports sync deposit and async redeem', async function () {
      await expect(this.mock.$_isDepositAsync()).to.eventually.equal(false);
      await expect(this.mock.$_isRedeemAsync()).to.eventually.equal(true);
    });
  });

  shouldBehaveLikeERC7540Operator();
  shouldBehaveLikeERC4626Deposit({ isERC7540: true });
  shouldBehaveLikeERC7540Redeem({ supportCustomFulfill: true });
  shouldBehaveLikeERC7575();
});
