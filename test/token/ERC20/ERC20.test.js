const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const {
  bigint: { shouldBehaveLikeERC20, shouldBehaveLikeERC20Transfer, shouldBehaveLikeERC20Approve },
} = require('./ERC20.behavior');
const { expectRevertCustomError } = require('../../helpers/customError');

const TOKENS = [{ Token: '$ERC20' }, { Token: '$ERC20ApprovalMock', forcedApproval: true }];

describe.only('ERC20', function () {
  const name = 'My Token';
  const symbol = 'MTKN';
  const initialSupply = 100n;

  for (const { Token, forcedApproval } of TOKENS) {
    describe(`using ${Token}`, function () {
      const fixture = async () => {
        const [initialHolder, recipient, anotherAccount] = await ethers.getSigners();

        const token = await ethers.deployContract(Token, [name, symbol]);
        await this.token.$_mint(initialHolder, initialSupply);

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
        expect(await this.token.decimals()).to.be.bignumber.equal('18');
      });

      describe('_mint', function () {
        const value = new BN(50);
        it('rejects a null account', async function () {
          await expectRevertCustomError(this.token.$_mint(ZERO_ADDRESS, value), 'ERC20InvalidReceiver', [ZERO_ADDRESS]);
        });

        it('rejects overflow', async function () {
          const maxUint256 = new BN('2').pow(new BN(256)).subn(1);
          await expectRevert(
            this.token.$_mint(recipient, maxUint256),
            'reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)',
          );
        });

        describe('for a non zero account', function () {
          beforeEach('minting', async function () {
            this.receipt = await this.token.$_mint(recipient, value);
          });

          it('increments totalSupply', async function () {
            const expectedSupply = initialSupply.add(value);
            expect(await this.token.totalSupply()).to.be.bignumber.equal(expectedSupply);
          });

          it('increments recipient balance', async function () {
            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(value);
          });

          it('emits Transfer event', async function () {
            const event = expectEvent(this.receipt, 'Transfer', { from: ZERO_ADDRESS, to: recipient });

            expect(event.args.value).to.be.bignumber.equal(value);
          });
        });
      });

      describe('_burn', function () {
        it('rejects a null account', async function () {
          await expectRevertCustomError(this.token.$_burn(ZERO_ADDRESS, new BN(1)), 'ERC20InvalidSender', [
            ZERO_ADDRESS,
          ]);
        });

        describe('for a non zero account', function () {
          it('rejects burning more than balance', async function () {
            await expectRevertCustomError(
              this.token.$_burn(initialHolder, initialSupply.addn(1)),
              'ERC20InsufficientBalance',
              [initialHolder, initialSupply, initialSupply.addn(1)],
            );
          });

          const describeBurn = function (description, value) {
            describe(description, function () {
              beforeEach('burning', async function () {
                this.receipt = await this.token.$_burn(initialHolder, value);
              });

              it('decrements totalSupply', async function () {
                const expectedSupply = initialSupply.sub(value);
                expect(await this.token.totalSupply()).to.be.bignumber.equal(expectedSupply);
              });

              it('decrements initialHolder balance', async function () {
                const expectedBalance = initialSupply.sub(value);
                expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(expectedBalance);
              });

              it('emits Transfer event', async function () {
                const event = expectEvent(this.receipt, 'Transfer', { from: initialHolder, to: ZERO_ADDRESS });

                expect(event.args.value).to.be.bignumber.equal(value);
              });
            });
          };

          describeBurn('for entire balance', initialSupply);
          describeBurn('for less value than balance', initialSupply - 1n);
        });
      });

      describe('_update', function () {
        const value = new BN(1);

        it('from is the zero address', async function () {
          const balanceBefore = await this.token.balanceOf(initialHolder);
          const totalSupply = await this.token.totalSupply();

          expectEvent(await this.token.$_update(ZERO_ADDRESS, initialHolder, value), 'Transfer', {
            from: ZERO_ADDRESS,
            to: initialHolder,
            value: value,
          });
          expect(await this.token.totalSupply()).to.be.bignumber.equal(totalSupply.add(value));
          expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(balanceBefore.add(value));
        });

        it('to is the zero address', async function () {
          const balanceBefore = await this.token.balanceOf(initialHolder);
          const totalSupply = await this.token.totalSupply();

          expectEvent(await this.token.$_update(initialHolder, ZERO_ADDRESS, value), 'Transfer', {
            from: initialHolder,
            to: ZERO_ADDRESS,
            value: value,
          });
          expect(await this.token.totalSupply()).to.be.bignumber.equal(totalSupply.sub(value));
          expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(balanceBefore.sub(value));
        });

        it('from and to are the zero address', async function () {
          const totalSupply = await this.token.totalSupply();

          await this.token.$_update(ZERO_ADDRESS, ZERO_ADDRESS, value);

          expect(await this.token.totalSupply()).to.be.bignumber.equal(totalSupply);
          expectEvent(await this.token.$_update(ZERO_ADDRESS, ZERO_ADDRESS, value), 'Transfer', {
            from: ZERO_ADDRESS,
            to: ZERO_ADDRESS,
            value: value,
          });
        });
      });

      describe('_transfer', function () {
        beforeEach(function () {
          this.transfer = this.token.$_transfer
        })

        shouldBehaveLikeERC20Transfer(initialSupply);

        describe('when the sender is the zero address', function () {
          it('reverts', async function () {
            await expectRevertCustomError(
              this.token.$_transfer(ZERO_ADDRESS, recipient, initialSupply),
              'ERC20InvalidSender',
              [ZERO_ADDRESS],
            );
          });
        });
      });

      describe('_approve', function () {
        beforeEach(function () {
          this.approve = this.token.$_approve
        })

        shouldBehaveLikeERC20Approve(initialSupply);

        describe('when the owner is the zero address', function () {
          it('reverts', async function () {
            await expectRevertCustomError(
              this.token.$_approve(ZERO_ADDRESS, recipient, initialSupply),
              'ERC20InvalidApprover',
              [ZERO_ADDRESS],
            );
          });
        });
      });
    });
  }
});
