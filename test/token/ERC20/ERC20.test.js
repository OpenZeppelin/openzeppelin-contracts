const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const {
  shouldBehaveLikeERC20,
  shouldBehaveLikeERC20Transfer,
  shouldBehaveLikeERC20Approve,
} = require('./ERC20.behavior');
const { expectRevertCustomError } = require('../../helpers/customError');

const ERC20 = artifacts.require('$ERC20');
const ERC20Decimals = artifacts.require('$ERC20DecimalsMock');

contract('ERC20', function (accounts) {
  const [initialHolder, recipient, anotherAccount] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';

  const initialSupply = new BN(100);

  beforeEach(async function () {
    this.token = await ERC20.new(name, symbol);
    await this.token.$_mint(initialHolder, initialSupply);
  });

  it('has a name', async function () {
    expect(await this.token.name()).to.equal(name);
  });

  it('has a symbol', async function () {
    expect(await this.token.symbol()).to.equal(symbol);
  });

  it('has 18 decimals', async function () {
    expect(await this.token.decimals()).to.be.bignumber.equal('18');
  });

  describe('set decimals', function () {
    const decimals = new BN(6);

    it('can set decimals during construction', async function () {
      const token = await ERC20Decimals.new(name, symbol, decimals);
      expect(await token.decimals()).to.be.bignumber.equal(decimals);
    });
  });

  shouldBehaveLikeERC20(initialSupply, initialHolder, recipient, anotherAccount);

  describe('decrease allowance', function () {
    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      function shouldDecreaseApproval(amount) {
        describe('when there was no approved amount before', function () {
          it('reverts', async function () {
            const allowance = await this.token.allowance(initialHolder, spender);
            await expectRevertCustomError(
              this.token.decreaseAllowance(spender, amount, { from: initialHolder }),
              'ERC20FailedDecreaseAllowance',
              [spender, allowance, amount],
            );
          });
        });

        describe('when the spender had an approved amount', function () {
          const approvedAmount = amount;

          beforeEach(async function () {
            await this.token.approve(spender, approvedAmount, { from: initialHolder });
          });

          it('emits an approval event', async function () {
            expectEvent(
              await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder }),
              'Approval',
              { owner: initialHolder, spender: spender, value: new BN(0) },
            );
          });

          it('decreases the spender allowance subtracting the requested amount', async function () {
            await this.token.decreaseAllowance(spender, approvedAmount.subn(1), { from: initialHolder });

            expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal('1');
          });

          it('sets the allowance to zero when all allowance is removed', async function () {
            await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder });
            expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal('0');
          });

          it('reverts when more than the full allowance is removed', async function () {
            await expectRevertCustomError(
              this.token.decreaseAllowance(spender, approvedAmount.addn(1), { from: initialHolder }),
              'ERC20FailedDecreaseAllowance',
              [spender, approvedAmount, approvedAmount.addn(1)],
            );
          });
        });
      }

      describe('when the sender has enough balance', function () {
        const amount = initialSupply;

        shouldDecreaseApproval(amount);
      });

      describe('when the sender does not have enough balance', function () {
        const amount = initialSupply.addn(1);

        shouldDecreaseApproval(amount);
      });
    });

    describe('when the spender is the zero address', function () {
      const amount = initialSupply;
      const spender = ZERO_ADDRESS;

      it('reverts', async function () {
        await expectRevertCustomError(
          this.token.decreaseAllowance(spender, amount, { from: initialHolder }),
          'ERC20FailedDecreaseAllowance',
          [spender, 0, amount],
        );
      });
    });
  });

  describe('increase allowance', function () {
    const amount = initialSupply;

    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      describe('when the sender has enough balance', function () {
        it('emits an approval event', async function () {
          expectEvent(await this.token.increaseAllowance(spender, amount, { from: initialHolder }), 'Approval', {
            owner: initialHolder,
            spender: spender,
            value: amount,
          });
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: initialHolder });

            expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, new BN(1), { from: initialHolder });
          });

          it('increases the spender allowance adding the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: initialHolder });

            expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount.addn(1));
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = initialSupply.addn(1);

        it('emits an approval event', async function () {
          expectEvent(await this.token.increaseAllowance(spender, amount, { from: initialHolder }), 'Approval', {
            owner: initialHolder,
            spender: spender,
            value: amount,
          });
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: initialHolder });

            expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, new BN(1), { from: initialHolder });
          });

          it('increases the spender allowance adding the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: initialHolder });

            expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount.addn(1));
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      const spender = ZERO_ADDRESS;

      it('reverts', async function () {
        await expectRevertCustomError(
          this.token.increaseAllowance(spender, amount, { from: initialHolder }),
          'ERC20InvalidSpender',
          [ZERO_ADDRESS],
        );
      });
    });
  });

  describe('_mint', function () {
    const amount = new BN(50);
    it('rejects a null account', async function () {
      await expectRevertCustomError(this.token.$_mint(ZERO_ADDRESS, amount), 'ERC20InvalidReceiver', [ZERO_ADDRESS]);
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
        this.receipt = await this.token.$_mint(recipient, amount);
      });

      it('increments totalSupply', async function () {
        const expectedSupply = initialSupply.add(amount);
        expect(await this.token.totalSupply()).to.be.bignumber.equal(expectedSupply);
      });

      it('increments recipient balance', async function () {
        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(amount);
      });

      it('emits Transfer event', async function () {
        const event = expectEvent(this.receipt, 'Transfer', { from: ZERO_ADDRESS, to: recipient });

        expect(event.args.value).to.be.bignumber.equal(amount);
      });
    });
  });

  describe('_burn', function () {
    it('rejects a null account', async function () {
      await expectRevertCustomError(this.token.$_burn(ZERO_ADDRESS, new BN(1)), 'ERC20InvalidSender', [ZERO_ADDRESS]);
    });

    describe('for a non zero account', function () {
      it('rejects burning more than balance', async function () {
        await expectRevertCustomError(
          this.token.$_burn(initialHolder, initialSupply.addn(1)),
          'ERC20InsufficientBalance',
          [initialHolder, initialSupply, initialSupply.addn(1)],
        );
      });

      const describeBurn = function (description, amount) {
        describe(description, function () {
          beforeEach('burning', async function () {
            this.receipt = await this.token.$_burn(initialHolder, amount);
          });

          it('decrements totalSupply', async function () {
            const expectedSupply = initialSupply.sub(amount);
            expect(await this.token.totalSupply()).to.be.bignumber.equal(expectedSupply);
          });

          it('decrements initialHolder balance', async function () {
            const expectedBalance = initialSupply.sub(amount);
            expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(expectedBalance);
          });

          it('emits Transfer event', async function () {
            const event = expectEvent(this.receipt, 'Transfer', { from: initialHolder, to: ZERO_ADDRESS });

            expect(event.args.value).to.be.bignumber.equal(amount);
          });
        });
      };

      describeBurn('for entire balance', initialSupply);
      describeBurn('for less amount than balance', initialSupply.subn(1));
    });
  });

  describe('_update', function () {
    const amount = new BN(1);

    it('from is the zero address', async function () {
      const balanceBefore = await this.token.balanceOf(initialHolder);
      const totalSupply = await this.token.totalSupply();

      expectEvent(await this.token.$_update(ZERO_ADDRESS, initialHolder, amount), 'Transfer', {
        from: ZERO_ADDRESS,
        to: initialHolder,
        value: amount,
      });
      expect(await this.token.totalSupply()).to.be.bignumber.equal(totalSupply.add(amount));
      expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(balanceBefore.add(amount));
    });

    it('to is the zero address', async function () {
      const balanceBefore = await this.token.balanceOf(initialHolder);
      const totalSupply = await this.token.totalSupply();

      expectEvent(await this.token.$_update(initialHolder, ZERO_ADDRESS, amount), 'Transfer', {
        from: initialHolder,
        to: ZERO_ADDRESS,
        value: amount,
      });
      expect(await this.token.totalSupply()).to.be.bignumber.equal(totalSupply.sub(amount));
      expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(balanceBefore.sub(amount));
    });

    it('from and to are the zero address', async function () {
      const totalSupply = await this.token.totalSupply();

      await this.token.$_update(ZERO_ADDRESS, ZERO_ADDRESS, amount);

      expect(await this.token.totalSupply()).to.be.bignumber.equal(totalSupply);
      expectEvent(await this.token.$_update(ZERO_ADDRESS, ZERO_ADDRESS, amount), 'Transfer', {
        from: ZERO_ADDRESS,
        to: ZERO_ADDRESS,
        value: amount,
      });
    });
  });

  describe('_transfer', function () {
    shouldBehaveLikeERC20Transfer(initialHolder, recipient, initialSupply, function (from, to, amount) {
      return this.token.$_transfer(from, to, amount);
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
    shouldBehaveLikeERC20Approve(initialHolder, recipient, initialSupply, function (owner, spender, amount) {
      return this.token.$_approve(owner, spender, amount);
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
