const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC20 } = require('../ERC20.behavior');

const name = 'My Token';
const symbol = 'MTKN';
const decimals = 9n;
const initialSupply = 100n;

async function fixture() {
  const [initialHolder, recipient, anotherAccount] = await ethers.getSigners();

  const underlying = await ethers.deployContract('$ERC20DecimalsMock', [name, symbol, decimals]);
  await underlying.$_mint(initialHolder, initialSupply);

  const token = await ethers.deployContract('$ERC20Wrapper', [`Wrapped ${name}`, `W${symbol}`, underlying]);

  return { initialHolder, recipient, anotherAccount, underlying, token };
}

describe('ERC20Wrapper', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  afterEach('Underlying balance', async function () {
    expect(await this.underlying.balanceOf(this.token)).to.be.equal(await this.token.totalSupply());
  });

  it('has a name', async function () {
    expect(await this.token.name()).to.equal(`Wrapped ${name}`);
  });

  it('has a symbol', async function () {
    expect(await this.token.symbol()).to.equal(`W${symbol}`);
  });

  it('has the same decimals as the underlying token', async function () {
    expect(await this.token.decimals()).to.be.equal(decimals);
  });

  it('decimals default back to 18 if token has no metadata', async function () {
    const noDecimals = await ethers.deployContract('CallReceiverMock');
    const token = await ethers.deployContract('$ERC20Wrapper', [`Wrapped ${name}`, `W${symbol}`, noDecimals]);
    expect(await token.decimals()).to.be.equal(18n);
  });

  it('has underlying', async function () {
    expect(await this.token.underlying()).to.be.equal(this.underlying.target);
  });

  describe('deposit', function () {
    it('executes with approval', async function () {
      await this.underlying.connect(this.initialHolder).approve(this.token, initialSupply);

      const tx = await this.token.connect(this.initialHolder).depositFor(this.initialHolder, initialSupply);
      await expect(tx)
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.initialHolder.address, this.token.target, initialSupply)
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.initialHolder.address, initialSupply);
      await expect(tx).to.changeTokenBalances(
        this.underlying,
        [this.initialHolder, this.token],
        [-initialSupply, initialSupply],
      );
      await expect(tx).to.changeTokenBalance(this.token, this.initialHolder, initialSupply);
    });

    it('reverts when missing approval', async function () {
      await expect(this.token.connect(this.initialHolder).depositFor(this.initialHolder, initialSupply))
        .to.be.revertedWithCustomError(this.underlying, 'ERC20InsufficientAllowance')
        .withArgs(this.token.target, 0, initialSupply);
    });

    it('reverts when inssuficient balance', async function () {
      await this.underlying.connect(this.initialHolder).approve(this.token, ethers.MaxUint256);

      await expect(this.token.connect(this.initialHolder).depositFor(this.initialHolder, ethers.MaxUint256))
        .to.be.revertedWithCustomError(this.underlying, 'ERC20InsufficientBalance')
        .withArgs(this.initialHolder.address, initialSupply, ethers.MaxUint256);
    });

    it('deposits to other account', async function () {
      await this.underlying.connect(this.initialHolder).approve(this.token, initialSupply);

      const tx = await this.token.connect(this.initialHolder).depositFor(this.recipient, initialSupply);
      await expect(tx)
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.initialHolder.address, this.token.target, initialSupply)
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.recipient.address, initialSupply);
      await expect(tx).to.changeTokenBalances(
        this.underlying,
        [this.initialHolder, this.token],
        [-initialSupply, initialSupply],
      );
      await expect(tx).to.changeTokenBalances(this.token, [this.initialHolder, this.recipient], [0, initialSupply]);
    });

    it('reverts minting to the wrapper contract', async function () {
      await this.underlying.connect(this.initialHolder).approve(this.token, ethers.MaxUint256);

      await expect(this.token.connect(this.initialHolder).depositFor(this.token, ethers.MaxUint256))
        .to.be.revertedWithCustomError(this.token, 'ERC20InvalidReceiver')
        .withArgs(this.token.target);
    });
  });

  describe('withdraw', function () {
    beforeEach(async function () {
      await this.underlying.connect(this.initialHolder).approve(this.token, initialSupply);
      await this.token.connect(this.initialHolder).depositFor(this.initialHolder, initialSupply);
    });

    it('reverts when inssuficient balance', async function () {
      await expect(this.token.connect(this.initialHolder).withdrawTo(this.initialHolder, ethers.MaxInt256))
        .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientBalance')
        .withArgs(this.initialHolder.address, initialSupply, ethers.MaxInt256);
    });

    it('executes when operation is valid', async function () {
      const value = 42n;

      const tx = await this.token.connect(this.initialHolder).withdrawTo(this.initialHolder, value);
      await expect(tx)
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.token.target, this.initialHolder.address, value)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.initialHolder.address, ethers.ZeroAddress, value);
      await expect(tx).to.changeTokenBalances(this.underlying, [this.token, this.initialHolder], [-value, value]);
      await expect(tx).to.changeTokenBalance(this.token, this.initialHolder, -value);
    });

    it('entire balance', async function () {
      const tx = await this.token.connect(this.initialHolder).withdrawTo(this.initialHolder, initialSupply);
      await expect(tx)
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.token.target, this.initialHolder.address, initialSupply)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.initialHolder.address, ethers.ZeroAddress, initialSupply);
      await expect(tx).to.changeTokenBalances(
        this.underlying,
        [this.token, this.initialHolder],
        [-initialSupply, initialSupply],
      );
      await expect(tx).to.changeTokenBalance(this.token, this.initialHolder, -initialSupply);
    });

    it('to other account', async function () {
      const tx = await this.token.connect(this.initialHolder).withdrawTo(this.recipient, initialSupply);
      await expect(tx)
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.token.target, this.recipient.address, initialSupply)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.initialHolder.address, ethers.ZeroAddress, initialSupply);
      await expect(tx).to.changeTokenBalances(
        this.underlying,
        [this.token, this.initialHolder, this.recipient],
        [-initialSupply, 0, initialSupply],
      );
      await expect(tx).to.changeTokenBalance(this.token, this.initialHolder, -initialSupply);
    });

    it('reverts withdrawing to the wrapper contract', async function () {
      await expect(this.token.connect(this.initialHolder).withdrawTo(this.token, initialSupply))
        .to.be.revertedWithCustomError(this.token, 'ERC20InvalidReceiver')
        .withArgs(this.token.target);
    });
  });

  describe('recover', function () {
    it('nothing to recover', async function () {
      await this.underlying.connect(this.initialHolder).approve(this.token, initialSupply);
      await this.token.connect(this.initialHolder).depositFor(this.initialHolder, initialSupply);

      const tx = await this.token.$_recover(this.recipient);
      await expect(tx).to.emit(this.token, 'Transfer').withArgs(ethers.ZeroAddress, this.recipient.address, 0n);
      await expect(tx).to.changeTokenBalance(this.token, this.recipient, 0);
    });

    it('something to recover', async function () {
      await this.underlying.connect(this.initialHolder).transfer(this.token, initialSupply);

      const tx = await this.token.$_recover(this.recipient);
      await expect(tx)
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.recipient.address, initialSupply);
      await expect(tx).to.changeTokenBalance(this.token, this.recipient, initialSupply);
    });
  });

  describe('erc20 behaviour', function () {
    beforeEach(async function () {
      await this.underlying.connect(this.initialHolder).approve(this.token, initialSupply);
      await this.token.connect(this.initialHolder).depositFor(this.initialHolder, initialSupply);
    });

    shouldBehaveLikeERC20(initialSupply);
  });
});
