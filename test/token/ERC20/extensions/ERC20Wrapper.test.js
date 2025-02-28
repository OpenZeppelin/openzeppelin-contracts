const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC20 } = require('../ERC20.behavior');

const name = 'My Token';
const symbol = 'MTKN';
const decimals = 9n;
const initialSupply = 100n;

async function fixture() {
  // this.accounts is used by shouldBehaveLikeERC20
  const accounts = await ethers.getSigners();
  const [holder, recipient, other] = accounts;

  const underlying = await ethers.deployContract('$ERC20DecimalsMock', [name, symbol, decimals]);
  await underlying.$_mint(holder, initialSupply);

  const token = await ethers.deployContract('$ERC20Wrapper', [`Wrapped ${name}`, `W${symbol}`, underlying]);

  return { accounts, holder, recipient, other, underlying, token };
}

describe('ERC20Wrapper', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  afterEach('Underlying balance', async function () {
    expect(await this.underlying.balanceOf(this.token)).to.equal(await this.token.totalSupply());
  });

  it('has a name', async function () {
    expect(await this.token.name()).to.equal(`Wrapped ${name}`);
  });

  it('has a symbol', async function () {
    expect(await this.token.symbol()).to.equal(`W${symbol}`);
  });

  it('has the same decimals as the underlying token', async function () {
    expect(await this.token.decimals()).to.equal(decimals);
  });

  it('decimals default back to 18 if token has no metadata', async function () {
    const noDecimals = await ethers.deployContract('CallReceiverMock');
    const token = await ethers.deployContract('$ERC20Wrapper', [`Wrapped ${name}`, `W${symbol}`, noDecimals]);
    expect(await token.decimals()).to.equal(18n);
  });

  it('has underlying', async function () {
    expect(await this.token.underlying()).to.equal(this.underlying);
  });

  describe('deposit', function () {
    it('executes with approval', async function () {
      await this.underlying.connect(this.holder).approve(this.token, initialSupply);

      const tx = await this.token.connect(this.holder).depositFor(this.holder, initialSupply);
      await expect(tx)
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.holder, this.token, initialSupply)
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.holder, initialSupply);
      await expect(tx).to.changeTokenBalances(
        this.underlying,
        [this.holder, this.token],
        [-initialSupply, initialSupply],
      );
      await expect(tx).to.changeTokenBalance(this.token, this.holder, initialSupply);
    });

    it('reverts when missing approval', async function () {
      await expect(this.token.connect(this.holder).depositFor(this.holder, initialSupply))
        .to.be.revertedWithCustomError(this.underlying, 'ERC20InsufficientAllowance')
        .withArgs(this.token, 0, initialSupply);
    });

    it('reverts when insufficient balance', async function () {
      await this.underlying.connect(this.holder).approve(this.token, ethers.MaxUint256);

      await expect(this.token.connect(this.holder).depositFor(this.holder, ethers.MaxUint256))
        .to.be.revertedWithCustomError(this.underlying, 'ERC20InsufficientBalance')
        .withArgs(this.holder, initialSupply, ethers.MaxUint256);
    });

    it('deposits to other account', async function () {
      await this.underlying.connect(this.holder).approve(this.token, initialSupply);

      const tx = await this.token.connect(this.holder).depositFor(this.recipient, initialSupply);
      await expect(tx)
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.holder, this.token.target, initialSupply)
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.recipient, initialSupply);
      await expect(tx).to.changeTokenBalances(
        this.underlying,
        [this.holder, this.token],
        [-initialSupply, initialSupply],
      );
      await expect(tx).to.changeTokenBalances(this.token, [this.holder, this.recipient], [0, initialSupply]);
    });

    it('reverts minting to the wrapper contract', async function () {
      await this.underlying.connect(this.holder).approve(this.token, ethers.MaxUint256);

      await expect(this.token.connect(this.holder).depositFor(this.token, ethers.MaxUint256))
        .to.be.revertedWithCustomError(this.token, 'ERC20InvalidReceiver')
        .withArgs(this.token);
    });
  });

  describe('withdraw', function () {
    beforeEach(async function () {
      await this.underlying.connect(this.holder).approve(this.token, initialSupply);
      await this.token.connect(this.holder).depositFor(this.holder, initialSupply);
    });

    it('reverts when insufficient balance', async function () {
      await expect(this.token.connect(this.holder).withdrawTo(this.holder, ethers.MaxInt256))
        .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientBalance')
        .withArgs(this.holder, initialSupply, ethers.MaxInt256);
    });

    it('executes when operation is valid', async function () {
      const value = 42n;

      const tx = await this.token.connect(this.holder).withdrawTo(this.holder, value);
      await expect(tx)
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.token.target, this.holder, value)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.holder, ethers.ZeroAddress, value);
      await expect(tx).to.changeTokenBalances(this.underlying, [this.token, this.holder], [-value, value]);
      await expect(tx).to.changeTokenBalance(this.token, this.holder, -value);
    });

    it('entire balance', async function () {
      const tx = await this.token.connect(this.holder).withdrawTo(this.holder, initialSupply);
      await expect(tx)
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.token.target, this.holder, initialSupply)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.holder, ethers.ZeroAddress, initialSupply);
      await expect(tx).to.changeTokenBalances(
        this.underlying,
        [this.token, this.holder],
        [-initialSupply, initialSupply],
      );
      await expect(tx).to.changeTokenBalance(this.token, this.holder, -initialSupply);
    });

    it('to other account', async function () {
      const tx = await this.token.connect(this.holder).withdrawTo(this.recipient, initialSupply);
      await expect(tx)
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.token, this.recipient, initialSupply)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.holder, ethers.ZeroAddress, initialSupply);
      await expect(tx).to.changeTokenBalances(
        this.underlying,
        [this.token, this.holder, this.recipient],
        [-initialSupply, 0, initialSupply],
      );
      await expect(tx).to.changeTokenBalance(this.token, this.holder, -initialSupply);
    });

    it('reverts withdrawing to the wrapper contract', async function () {
      await expect(this.token.connect(this.holder).withdrawTo(this.token, initialSupply))
        .to.be.revertedWithCustomError(this.token, 'ERC20InvalidReceiver')
        .withArgs(this.token);
    });
  });

  describe('recover', function () {
    it('nothing to recover', async function () {
      await this.underlying.connect(this.holder).approve(this.token, initialSupply);
      await this.token.connect(this.holder).depositFor(this.holder, initialSupply);

      const tx = await this.token.$_recover(this.recipient);
      await expect(tx).to.emit(this.token, 'Transfer').withArgs(ethers.ZeroAddress, this.recipient, 0n);
      await expect(tx).to.changeTokenBalance(this.token, this.recipient, 0);
    });

    it('something to recover', async function () {
      await this.underlying.connect(this.holder).transfer(this.token, initialSupply);

      const tx = await this.token.$_recover(this.recipient);
      await expect(tx).to.emit(this.token, 'Transfer').withArgs(ethers.ZeroAddress, this.recipient, initialSupply);
      await expect(tx).to.changeTokenBalance(this.token, this.recipient, initialSupply);
    });
  });

  describe('erc20 behaviour', function () {
    beforeEach(async function () {
      await this.underlying.connect(this.holder).approve(this.token, initialSupply);
      await this.token.connect(this.holder).depositFor(this.holder, initialSupply);
    });

    shouldBehaveLikeERC20(initialSupply);
  });
});
