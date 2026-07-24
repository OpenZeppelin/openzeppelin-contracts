const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const time = require('../../../helpers/time');

const { shouldBehaveLikeERC20 } = require('../ERC20.behavior');

const name = 'My Token';
const symbol = 'MTKN';
const initialSupply = 100n;
const defaultApprovalDuration = 3600n;

async function fixture() {
  // this.accounts is used by shouldBehaveLikeERC20
  const accounts = await ethers.getSigners();
  const [holder, recipient] = accounts;

  const token = await ethers.deployContract('$ERC20ExpiringApprovalMock', [name, symbol]);
  await token.$_mint(holder, initialSupply);

  return { accounts, holder, recipient, token };
}

async function legacyFixture() {
  const accounts = await ethers.getSigners();
  const [holder, recipient] = accounts;

  const token = await ethers.deployContract('ERC20ExpiringApprovalLegacyMock', [name, symbol]);
  await token.mint(holder, initialSupply);

  return { accounts, holder, recipient, token };
}

describe('ERC20ExpiringApproval', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC20(initialSupply);

  it('sets the default expiration on approve', async function () {
    const tx = await this.token.connect(this.holder).approve(this.recipient, 42n);
    const timestamp = await time.clockFromReceipt.timestamp(tx.wait());

    await expect(this.token.maxApprovalDuration()).to.eventually.equal(defaultApprovalDuration);
    await expect(tx)
      .to.emit(this.token, 'ApprovalExpiration')
      .withArgs(this.holder, this.recipient, timestamp + defaultApprovalDuration);
    await expect(this.token.allowanceAndExpiration(this.holder, this.recipient)).to.eventually.deep.equal([
      timestamp + defaultApprovalDuration,
      42n,
    ]);
  });

  it('sets a custom expiration on approveForDuration', async function () {
    const duration = defaultApprovalDuration;
    const tx = await this.token.connect(this.holder).approveForDuration(this.recipient, 42n, duration);
    const timestamp = await time.clockFromReceipt.timestamp(tx.wait());

    await expect(tx)
      .to.emit(this.token, 'ApprovalExpiration')
      .withArgs(this.holder, this.recipient, timestamp + duration);
    await expect(this.token.allowanceAndExpiration(this.holder, this.recipient)).to.eventually.deep.equal([
      timestamp + duration,
      42n,
    ]);
  });

  it('rejects durations above maxApprovalDuration', async function () {
    await expect(this.token.connect(this.holder).approveForDuration(this.recipient, 42n, 3601n))
      .to.be.revertedWithCustomError(this.token, 'ERC8255InvalidApprovalDuration')
      .withArgs(3601n, defaultApprovalDuration);
  });

  it('keeps approvals valid at the exact expiration timestamp', async function () {
    const value = 42n;
    const tx = await this.token.connect(this.holder).approveForDuration(this.recipient, value, defaultApprovalDuration);
    const timestamp = await time.clockFromReceipt.timestamp(tx.wait());
    const expiration = timestamp + defaultApprovalDuration;

    await time.increaseTo.timestamp(expiration, false);

    await expect(this.token.connect(this.recipient).transferFrom(this.holder, this.recipient, value))
      .to.emit(this.token, 'Transfer')
      .withArgs(this.holder, this.recipient, value);
  });

  it('returns zero effective allowance and stored allowance data when the approval expires', async function () {
    const duration = defaultApprovalDuration;
    const tx = await this.token.connect(this.holder).approveForDuration(this.recipient, 42n, duration);
    const timestamp = await time.clockFromReceipt.timestamp(tx.wait());

    await time.increaseTo.timestamp(timestamp + duration + 1n);

    await expect(this.token.allowance(this.holder, this.recipient)).to.eventually.equal(0n);
    await expect(this.token.allowanceAndExpiration(this.holder, this.recipient)).to.eventually.deep.equal([
      timestamp + duration,
      42n,
    ]);
    await expect(this.token.connect(this.recipient).transferFrom(this.holder, this.recipient, 1n))
      .to.be.revertedWithCustomError(this.token, 'ERC8255ExpiredApproval')
      .withArgs(this.recipient, timestamp + duration);
  });

  it('allows zero-duration approvals within the same transaction', async function () {
    const spender = await ethers.deployContract('$Address');
    const batch = await ethers.deployContract('BatchCaller');
    const value = 42n;

    await this.token.connect(this.holder).transfer(batch, value);

    await expect(
      batch.execute([
        {
          target: this.token,
          value: 0n,
          data: this.token.interface.encodeFunctionData('approveForDuration', [spender.target, value, 0n]),
        },
        {
          target: spender,
          value: 0n,
          data: spender.interface.encodeFunctionData('$functionCall', [
            this.token.target,
            this.token.interface.encodeFunctionData('transferFrom', [batch.target, this.recipient.address, value]),
          ]),
        },
      ]),
    ).to.changeTokenBalances(this.token, [batch, this.recipient], [-value, value]);
  });

  it('preserves expiration when transferFrom spends part of the allowance', async function () {
    const duration = defaultApprovalDuration;
    const tx = await this.token.connect(this.holder).approveForDuration(this.recipient, 42n, duration);
    const timestamp = await time.clockFromReceipt.timestamp(tx.wait());

    await this.token.connect(this.recipient).transferFrom(this.holder, this.recipient, 17n);

    await expect(this.token.allowanceAndExpiration(this.holder, this.recipient)).to.eventually.deep.equal([
      timestamp + duration,
      25n,
    ]);
  });

  it('does not emit ApprovalExpiration when transferFrom spends allowance', async function () {
    await this.token.connect(this.holder).approveForDuration(this.recipient, 42n, defaultApprovalDuration);

    await expect(this.token.connect(this.recipient).transferFrom(this.holder, this.recipient, 17n)).to.not.emit(
      this.token,
      'ApprovalExpiration',
    );
  });

  it('clears expiration when the allowance is fully spent', async function () {
    await this.token.connect(this.holder).approveForDuration(this.recipient, 42n, defaultApprovalDuration);

    await this.token.connect(this.recipient).transferFrom(this.holder, this.recipient, 42n);

    await expect(this.token.allowanceAndExpiration(this.holder, this.recipient)).to.eventually.deep.equal([0n, 0n]);
  });

  it('supports max uint256 as an allowance sentinel', async function () {
    await this.token.connect(this.holder).approve(this.recipient, ethers.MaxUint256);

    await this.token.connect(this.recipient).transferFrom(this.holder, this.recipient, 1n);

    await expect(this.token.allowance(this.holder, this.recipient)).to.eventually.equal(ethers.MaxUint256);
  });

  it('supports the full uint256 allowance range', async function () {
    const value = ethers.MaxUint256 - 1n;
    const tx = await this.token.connect(this.holder).approve(this.recipient, value);
    const timestamp = await time.clockFromReceipt.timestamp(tx.wait());

    await expect(this.token.allowanceAndExpiration(this.holder, this.recipient)).to.eventually.deep.equal([
      timestamp + defaultApprovalDuration,
      value,
    ]);
  });

  it('rejects approvals whose expiration no longer fits in uint64', async function () {
    await expect(this.token.getFunction('$_expiration(uint256,uint32,uint256)')(42n, 0n, 2n ** 64n))
      .to.be.revertedWithCustomError(this.token, 'ERC8255InvalidApprovalExpiration')
      .withArgs(2n ** 64n);
  });

  describe('legacy-compatible spenders', function () {
    beforeEach(async function () {
      Object.assign(this, await loadFixture(legacyFixture));
    });

    it('does not treat spenders as legacy-compatible by default', async function () {
      const duration = defaultApprovalDuration;
      const tx = await this.token.connect(this.holder).approveForDuration(this.recipient, 42n, duration);
      const timestamp = await time.clockFromReceipt.timestamp(tx.wait());

      await time.increaseTo.timestamp(timestamp + duration + 1n);

      await expect(this.token.allowance(this.holder, this.recipient)).to.eventually.equal(0n);
      await expect(this.token.allowanceAndExpiration(this.holder, this.recipient)).to.eventually.deep.equal([
        timestamp + duration,
        42n,
      ]);
    });

    it('treats an expired allowance as unexpired while the spender is legacy-compatible', async function () {
      const duration = defaultApprovalDuration;
      const tx = await this.token.connect(this.holder).approveForDuration(this.recipient, 42n, duration);
      const timestamp = await time.clockFromReceipt.timestamp(tx.wait());

      await time.increaseTo.timestamp(timestamp + duration + 1n);
      await this.token.setLegacyCompatibleSpender(this.recipient, true);

      const currentTimestamp = await time.clock.timestamp();
      await expect(this.token.allowance(this.holder, this.recipient)).to.eventually.equal(42n);
      await expect(this.token.allowanceAndExpiration(this.holder, this.recipient)).to.eventually.deep.equal([
        currentTimestamp,
        42n,
      ]);
      await expect(this.token.connect(this.recipient).transferFrom(this.holder, this.recipient, 1n))
        .to.emit(this.token, 'Transfer')
        .withArgs(this.holder, this.recipient, 1n);
    });

    it('preserves the stored expiration when a legacy-compatible spender uses an expired allowance', async function () {
      const duration = defaultApprovalDuration;
      const tx = await this.token.connect(this.holder).approveForDuration(this.recipient, 42n, duration);
      const timestamp = await time.clockFromReceipt.timestamp(tx.wait());
      const expiration = timestamp + duration;

      await time.increaseTo.timestamp(expiration + 1n);
      await this.token.setLegacyCompatibleSpender(this.recipient, true);
      await this.token.connect(this.recipient).transferFrom(this.holder, this.recipient, 17n);
      await this.token.setLegacyCompatibleSpender(this.recipient, false);

      await expect(this.token.allowanceAndExpiration(this.holder, this.recipient)).to.eventually.deep.equal([
        expiration,
        25n,
      ]);
      await expect(this.token.allowance(this.holder, this.recipient)).to.eventually.equal(0n);
    });
  });
});
