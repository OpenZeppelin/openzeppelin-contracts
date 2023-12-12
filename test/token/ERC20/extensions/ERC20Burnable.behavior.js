const { ethers } = require('hardhat');
const { expect } = require('chai');

function shouldBehaveLikeERC20Burnable() {
  describe('burn', function () {
    it('reverts if not enough balance', async function () {
      const value = this.initialBalance + 1n;

      await expect(this.token.connect(this.owner).burn(value))
        .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientBalance')
        .withArgs(this.owner.address, this.initialBalance, value);
    });

    describe('on success', function () {
      for (const { title, value } of [
        { title: 'for a zero value', value: 0n },
        { title: 'for a non-zero value', value: 100n },
      ]) {
        describe(title, function () {
          beforeEach(async function () {
            this.tx = await this.token.connect(this.owner).burn(value);
          });

          it('burns the requested value', async function () {
            await expect(this.tx).to.changeTokenBalance(this.token, this.owner, -value);
          });

          it('emits a transfer event', async function () {
            await expect(this.tx)
              .to.emit(this.token, 'Transfer')
              .withArgs(this.owner.address, ethers.ZeroAddress, value);
          });
        });
      }
    });
  });

  describe('burnFrom', function () {
    describe('reverts', function () {
      it('if not enough balance', async function () {
        const value = this.initialBalance + 1n;

        await this.token.connect(this.owner).approve(this.burner, value);

        await expect(this.token.connect(this.burner).burnFrom(this.owner, value))
          .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientBalance')
          .withArgs(this.owner.address, this.initialBalance, value);
      });

      it('if not enough allowance', async function () {
        const allowance = 100n;

        await this.token.connect(this.owner).approve(this.burner, allowance);

        await expect(this.token.connect(this.burner).burnFrom(this.owner, allowance + 1n))
          .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientAllowance')
          .withArgs(this.burner.address, allowance, allowance + 1n);
      });
    });

    describe('on success', function () {
      for (const { title, value } of [
        { title: 'for a zero value', value: 0n },
        { title: 'for a non-zero value', value: 100n },
      ]) {
        describe(title, function () {
          const originalAllowance = value * 3n;

          beforeEach(async function () {
            await this.token.connect(this.owner).approve(this.burner, originalAllowance);
            this.tx = await this.token.connect(this.burner).burnFrom(this.owner, value);
          });

          it('burns the requested value', async function () {
            await expect(this.tx).to.changeTokenBalance(this.token, this.owner, -value);
          });

          it('decrements allowance', async function () {
            expect(await this.token.allowance(this.owner, this.burner)).to.equal(originalAllowance - value);
          });

          it('emits a transfer event', async function () {
            await expect(this.tx)
              .to.emit(this.token, 'Transfer')
              .withArgs(this.owner.address, ethers.ZeroAddress, value);
          });
        });
      }
    });
  });
}

module.exports = {
  shouldBehaveLikeERC20Burnable,
};
