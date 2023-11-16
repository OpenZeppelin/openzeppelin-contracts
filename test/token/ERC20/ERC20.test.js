const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const {
  bigint: { shouldBehaveLikeERC20, shouldBehaveLikeERC20Transfer, shouldBehaveLikeERC20Approve },
} = require('./ERC20.behavior');

const TOKENS = [{ Token: '$ERC20' }, { Token: '$ERC20ApprovalMock', forcedApproval: true }];

describe('ERC20', function () {
  const name = 'My Token';
  const symbol = 'MTKN';
  const initialSupply = 100n;

  for (const { Token, forcedApproval } of TOKENS) {
    describe(`using ${Token}`, function () {
      const fixture = async () => {
        const [initialHolder, recipient, anotherAccount] = await ethers.getSigners();

        const token = await ethers.deployContract(Token, [name, symbol]);
        await token.$_mint(initialHolder, initialSupply);

        return { initialHolder, recipient, anotherAccount, token };
      };

      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
      });

      shouldBehaveLikeERC20(initialSupply, { forcedApproval });

      it('has a name', async function () {
        expect(await this.token.name()).to.equal(name);
      });

      it('has a symbol', async function () {
        expect(await this.token.symbol()).to.equal(symbol);
      });

      it('has 18 decimals', async function () {
        expect(await this.token.decimals()).to.be.equal('18');
      });

      describe('_mint', function () {
        const value = 50n;
        it('rejects a null account', async function () {
          await expect(this.token.$_mint(ethers.ZeroAddress, value))
            .to.be.revertedWithCustomError(this.token, 'ERC20InvalidReceiver')
            .withArgs(ethers.ZeroAddress);
        });

        it('rejects overflow', async function () {
          await expect(this.token.$_mint(this.recipient, ethers.MaxUint256)).to.be.revertedWithPanic(0x11);
        });

        describe('for a non zero account', function () {
          beforeEach('minting', async function () {
            this.tx = await this.token.$_mint(this.recipient, value);
          });

          it('increments totalSupply', async function () {
            const expectedSupply = initialSupply + value;
            expect(await this.token.totalSupply()).to.be.equal(expectedSupply);
          });

          it('increments recipient balance', async function () {
            expect(await this.token.balanceOf(this.recipient)).to.be.equal(value);
          });

          it('emits Transfer event', async function () {
            await expect(this.tx)
              .to.emit(this.token, 'Transfer')
              .withArgs(ethers.ZeroAddress, this.recipient.address, value);
          });
        });
      });

      describe('_burn', function () {
        it('rejects a null account', async function () {
          await expect(this.token.$_burn(ethers.ZeroAddress, 1n))
            .to.be.revertedWithCustomError(this.token, 'ERC20InvalidSender')
            .withArgs(ethers.ZeroAddress);
        });

        describe('for a non zero account', function () {
          it('rejects burning more than balance', async function () {
            await expect(this.token.$_burn(this.initialHolder, initialSupply + 1n))
              .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientBalance')
              .withArgs(this.initialHolder.address, initialSupply, initialSupply + 1n);
          });

          const describeBurn = function (description, value) {
            describe(description, function () {
              beforeEach('burning', async function () {
                this.tx = await this.token.$_burn(this.initialHolder, value);
              });

              it('decrements totalSupply', async function () {
                expect(await this.token.totalSupply()).to.be.equal(initialSupply - value);
              });

              it('decrements initialHolder balance', async function () {
                expect(await this.token.balanceOf(this.initialHolder)).to.be.equal(initialSupply - value);
              });

              it('emits Transfer event', async function () {
                await expect(this.tx)
                  .to.emit(this.token, 'Transfer')
                  .withArgs(this.initialHolder.address, ethers.ZeroAddress, value);
              });
            });
          };

          describeBurn('for entire balance', initialSupply);
          describeBurn('for less value than balance', initialSupply - 1n);
        });
      });

      describe('_update', function () {
        const value = 1n;

        it('from is the zero address', async function () {
          const balanceBefore = await this.token.balanceOf(this.initialHolder);
          const totalSupply = await this.token.totalSupply();

          await expect(this.token.$_update(ethers.ZeroAddress, this.initialHolder, value))
            .to.emit(this.token, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.initialHolder.address, value);

          expect(await this.token.totalSupply()).to.be.equal(totalSupply + value);
          expect(await this.token.balanceOf(this.initialHolder)).to.be.equal(balanceBefore + value);
        });

        it('to is the zero address', async function () {
          const balanceBefore = await this.token.balanceOf(this.initialHolder);
          const totalSupply = await this.token.totalSupply();

          await expect(this.token.$_update(this.initialHolder, ethers.ZeroAddress, value))
            .to.emit(this.token, 'Transfer')
            .withArgs(this.initialHolder.address, ethers.ZeroAddress, value);
          expect(await this.token.totalSupply()).to.be.equal(totalSupply - value);
          expect(await this.token.balanceOf(this.initialHolder)).to.be.equal(balanceBefore - value);
        });

        it('from and to are the zero address', async function () {
          const totalSupply = await this.token.totalSupply();

          await expect(this.token.$_update(ethers.ZeroAddress, ethers.ZeroAddress, value))
            .to.emit(this.token, 'Transfer')
            .withArgs(ethers.ZeroAddress, ethers.ZeroAddress, value);

          expect(await this.token.totalSupply()).to.be.equal(totalSupply);
        });
      });

      describe('_transfer', function () {
        beforeEach(function () {
          this.transfer = this.token.$_transfer;
        });

        shouldBehaveLikeERC20Transfer(initialSupply);

        describe('when the sender is the zero address', function () {
          it('reverts', async function () {
            await expect(this.token.$_transfer(ethers.ZeroAddress, this.recipient, initialSupply))
              .to.be.revertedWithCustomError(this.token, 'ERC20InvalidSender')
              .withArgs(ethers.ZeroAddress);
          });
        });
      });

      describe('_approve', function () {
        beforeEach(function () {
          this.approve = this.token.$_approve;
        });

        shouldBehaveLikeERC20Approve(initialSupply);

        describe('when the owner is the zero address', function () {
          it('reverts', async function () {
            await expect(this.token.$_approve(ethers.ZeroAddress, this.recipient, initialSupply))
              .to.be.revertedWithCustomError(this.token, 'ERC20InvalidApprover')
              .withArgs(ethers.ZeroAddress);
          });
        });
      });
    });
  }
});
