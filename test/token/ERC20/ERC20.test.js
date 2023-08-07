const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const {
  shouldBehaveLikeERC20,
  shouldBehaveLikeERC20Transfer,
  shouldBehaveLikeERC20Approve,
} = require('./ERC20.behavior');
const { expectRevertCustomError } = require('../../helpers/customError');

const TOKENS = [
  { Token: artifacts.require('$ERC20') },
  { Token: artifacts.require('$ERC20ApprovalMock'), forcedApproval: true },
];

contract('ERC20', function (accounts) {
  const [initialHolder, recipient] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';
  const initialSupply = new BN(100);

  for (const { Token, forcedApproval } of TOKENS) {
    describe(`using ${Token._json.contractName}`, function () {
      beforeEach(async function () {
        this.token = await Token.new(name, symbol);
        await this.token.$_mint(initialHolder, initialSupply);
      });

      shouldBehaveLikeERC20(initialSupply, accounts, { forcedApproval });

      it('has a name', async function () {
        expect(await this.token.name()).to.equal(name);
      });

      it('has a symbol', async function () {
        expect(await this.token.symbol()).to.equal(symbol);
      });

      it('has 18 decimals', async function () {
        expect(await this.token.decimals()).to.be.bignumber.equal('18');
      });

      describe('decrease allowance', function () {
        describe('when the spender is not the zero address', function () {
          const spender = recipient;

          function shouldDecreaseApproval(value) {
            describe('when there was no approved value before', function () {
              it('reverts', async function () {
                const allowance = await this.token.allowance(initialHolder, spender);
                await expectRevertCustomError(
                  this.token.decreaseAllowance(spender, value, { from: initialHolder }),
                  'ERC20FailedDecreaseAllowance',
                  [spender, allowance, value],
                );
              });
            });

            describe('when the spender had an approved value', function () {
              const approvedValue = value;

              beforeEach(async function () {
                await this.token.approve(spender, approvedValue, { from: initialHolder });
              });

              it('emits an approval event', async function () {
                expectEvent(
                  await this.token.decreaseAllowance(spender, approvedValue, { from: initialHolder }),
                  'Approval',
                  { owner: initialHolder, spender: spender, value: new BN(0) },
                );
              });

              it('decreases the spender allowance subtracting the requested value', async function () {
                await this.token.decreaseAllowance(spender, approvedValue.subn(1), { from: initialHolder });

                expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal('1');
              });

              it('sets the allowance to zero when all allowance is removed', async function () {
                await this.token.decreaseAllowance(spender, approvedValue, { from: initialHolder });
                expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal('0');
              });

              it('reverts when more than the full allowance is removed', async function () {
                await expectRevertCustomError(
                  this.token.decreaseAllowance(spender, approvedValue.addn(1), { from: initialHolder }),
                  'ERC20FailedDecreaseAllowance',
                  [spender, approvedValue, approvedValue.addn(1)],
                );
              });
            });
          }

          describe('when the sender has enough balance', function () {
            const value = initialSupply;

            shouldDecreaseApproval(value);
          });

          describe('when the sender does not have enough balance', function () {
            const value = initialSupply.addn(1);

            shouldDecreaseApproval(value);
          });
        });

        describe('when the spender is the zero address', function () {
          const value = initialSupply;
          const spender = ZERO_ADDRESS;

          it('reverts', async function () {
            await expectRevertCustomError(
              this.token.decreaseAllowance(spender, value, { from: initialHolder }),
              'ERC20FailedDecreaseAllowance',
              [spender, 0, value],
            );
          });
        });
      });

      describe('increase allowance', function () {
        const value = initialSupply;

        describe('when the spender is not the zero address', function () {
          const spender = recipient;

          describe('when the sender has enough balance', function () {
            it('emits an approval event', async function () {
              expectEvent(await this.token.increaseAllowance(spender, value, { from: initialHolder }), 'Approval', {
                owner: initialHolder,
                spender: spender,
                value: value,
              });
            });

            describe('when there was no approved value before', function () {
              it('approves the requested value', async function () {
                await this.token.increaseAllowance(spender, value, { from: initialHolder });

                expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(value);
              });
            });

            describe('when the spender had an approved value', function () {
              beforeEach(async function () {
                await this.token.approve(spender, new BN(1), { from: initialHolder });
              });

              it('increases the spender allowance adding the requested value', async function () {
                await this.token.increaseAllowance(spender, value, { from: initialHolder });

                expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(value.addn(1));
              });
            });
          });

          describe('when the sender does not have enough balance', function () {
            const value = initialSupply.addn(1);

            it('emits an approval event', async function () {
              expectEvent(await this.token.increaseAllowance(spender, value, { from: initialHolder }), 'Approval', {
                owner: initialHolder,
                spender: spender,
                value: value,
              });
            });

            describe('when there was no approved value before', function () {
              it('approves the requested value', async function () {
                await this.token.increaseAllowance(spender, value, { from: initialHolder });

                expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(value);
              });
            });

            describe('when the spender had an approved value', function () {
              beforeEach(async function () {
                await this.token.approve(spender, new BN(1), { from: initialHolder });
              });

              it('increases the spender allowance adding the requested value', async function () {
                await this.token.increaseAllowance(spender, value, { from: initialHolder });

                expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(value.addn(1));
              });
            });
          });
        });

        describe('when the spender is the zero address', function () {
          const spender = ZERO_ADDRESS;

          it('reverts', async function () {
            await expectRevertCustomError(
              this.token.increaseAllowance(spender, value, { from: initialHolder }),
              'ERC20InvalidSpender',
              [ZERO_ADDRESS],
            );
          });
        });
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
          describeBurn('for less value than balance', initialSupply.subn(1));
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
        shouldBehaveLikeERC20Transfer(initialHolder, recipient, initialSupply, function (from, to, value) {
          return this.token.$_transfer(from, to, value);
        });

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
        shouldBehaveLikeERC20Approve(initialHolder, recipient, initialSupply, function (owner, spender, value) {
          return this.token.$_approve(owner, spender, value);
        });

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
