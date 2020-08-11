const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { BN, constants, expectEvent, expectRevert, singletons } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const {
  shouldBehaveLikeERC777DirectSendBurn,
  shouldBehaveLikeERC777OperatorSendBurn,
  shouldBehaveLikeERC777UnauthorizedOperatorSendBurn,
  shouldBehaveLikeERC777InternalMint,
  shouldBehaveLikeERC777SendBurnMintInternalWithReceiveHook,
  shouldBehaveLikeERC777SendBurnWithSendHook,
} = require('./ERC777.behavior');

const {
  shouldBehaveLikeERC20,
  shouldBehaveLikeERC20Approve,
} = require('../ERC20/ERC20.behavior');

const ERC777 = contract.fromArtifact('ERC777Mock');
const ERC777SenderRecipientMock = contract.fromArtifact('ERC777SenderRecipientMock');

describe('ERC777', function () {
  const [ registryFunder, holder, defaultOperatorA, defaultOperatorB, newOperator, anyone ] = accounts;

  const initialSupply = new BN('10000');
  const name = 'ERC777Test';
  const symbol = '777T';
  const data = web3.utils.sha3('OZ777TestData');
  const operatorData = web3.utils.sha3('OZ777TestOperatorData');

  const defaultOperators = [defaultOperatorA, defaultOperatorB];

  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
  });

  context('with default operators', function () {
    beforeEach(async function () {
      this.token = await ERC777.new(holder, initialSupply, name, symbol, defaultOperators);
    });

    describe('as an ERC20 token', function () {
      shouldBehaveLikeERC20('ERC777', initialSupply, holder, anyone, defaultOperatorA);

      describe('_approve', function () {
        shouldBehaveLikeERC20Approve('ERC777', holder, anyone, initialSupply, function (owner, spender, amount) {
          return this.token.approveInternal(owner, spender, amount);
        });

        describe('when the owner is the zero address', function () {
          it('reverts', async function () {
            await expectRevert(this.token.approveInternal(ZERO_ADDRESS, anyone, initialSupply),
              'ERC777: approve from the zero address'
            );
          });
        });
      });
    });

    it('does not emit AuthorizedOperator events for default operators', async function () {
      await expectEvent.notEmitted.inConstruction(this.token, 'AuthorizedOperator');
    });

    describe('basic information', function () {
      it('returns the name', async function () {
        expect(await this.token.name()).to.equal(name);
      });

      it('returns the symbol', async function () {
        expect(await this.token.symbol()).to.equal(symbol);
      });

      it('returns a granularity of 1', async function () {
        expect(await this.token.granularity()).to.be.bignumber.equal('1');
      });

      it('returns the default operators', async function () {
        expect(await this.token.defaultOperators()).to.deep.equal(defaultOperators);
      });

      it('default operators are operators for all accounts', async function () {
        for (const operator of defaultOperators) {
          expect(await this.token.isOperatorFor(operator, anyone)).to.equal(true);
        }
      });

      it('returns the total supply', async function () {
        expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply);
      });

      it('returns 18 when decimals is called', async function () {
        expect(await this.token.decimals()).to.be.bignumber.equal('18');
      });

      it('the ERC777Token interface is registered in the registry', async function () {
        expect(await this.erc1820.getInterfaceImplementer(this.token.address, web3.utils.soliditySha3('ERC777Token')))
          .to.equal(this.token.address);
      });

      it('the ERC20Token interface is registered in the registry', async function () {
        expect(await this.erc1820.getInterfaceImplementer(this.token.address, web3.utils.soliditySha3('ERC20Token')))
          .to.equal(this.token.address);
      });
    });

    describe('balanceOf', function () {
      context('for an account with no tokens', function () {
        it('returns zero', async function () {
          expect(await this.token.balanceOf(anyone)).to.be.bignumber.equal('0');
        });
      });

      context('for an account with tokens', function () {
        it('returns their balance', async function () {
          expect(await this.token.balanceOf(holder)).to.be.bignumber.equal(initialSupply);
        });
      });
    });

    context('with no ERC777TokensSender and no ERC777TokensRecipient implementers', function () {
      describe('send/burn', function () {
        shouldBehaveLikeERC777DirectSendBurn(holder, anyone, data);

        context('with self operator', function () {
          shouldBehaveLikeERC777OperatorSendBurn(holder, anyone, holder, data, operatorData);
        });

        context('with first default operator', function () {
          shouldBehaveLikeERC777OperatorSendBurn(holder, anyone, defaultOperatorA, data, operatorData);
        });

        context('with second default operator', function () {
          shouldBehaveLikeERC777OperatorSendBurn(holder, anyone, defaultOperatorB, data, operatorData);
        });

        context('before authorizing a new operator', function () {
          shouldBehaveLikeERC777UnauthorizedOperatorSendBurn(holder, anyone, newOperator, data, operatorData);
        });

        context('with new authorized operator', function () {
          beforeEach(async function () {
            await this.token.authorizeOperator(newOperator, { from: holder });
          });

          shouldBehaveLikeERC777OperatorSendBurn(holder, anyone, newOperator, data, operatorData);

          context('with revoked operator', function () {
            beforeEach(async function () {
              await this.token.revokeOperator(newOperator, { from: holder });
            });

            shouldBehaveLikeERC777UnauthorizedOperatorSendBurn(holder, anyone, newOperator, data, operatorData);
          });
        });
      });

      describe('mint (internal)', function () {
        const to = anyone;
        const amount = new BN('5');

        context('with default operator', function () {
          const operator = defaultOperatorA;

          shouldBehaveLikeERC777InternalMint(to, operator, amount, data, operatorData);
        });

        context('with non operator', function () {
          const operator = newOperator;

          shouldBehaveLikeERC777InternalMint(to, operator, amount, data, operatorData);
        });
      });
    });

    describe('operator management', function () {
      it('accounts are their own operator', async function () {
        expect(await this.token.isOperatorFor(holder, holder)).to.equal(true);
      });

      it('reverts when self-authorizing', async function () {
        await expectRevert(
          this.token.authorizeOperator(holder, { from: holder }), 'ERC777: authorizing self as operator'
        );
      });

      it('reverts when self-revoking', async function () {
        await expectRevert(
          this.token.revokeOperator(holder, { from: holder }), 'ERC777: revoking self as operator'
        );
      });

      it('non-operators can be revoked', async function () {
        expect(await this.token.isOperatorFor(newOperator, holder)).to.equal(false);

        const { logs } = await this.token.revokeOperator(newOperator, { from: holder });
        expectEvent.inLogs(logs, 'RevokedOperator', { operator: newOperator, tokenHolder: holder });

        expect(await this.token.isOperatorFor(newOperator, holder)).to.equal(false);
      });

      it('non-operators can be authorized', async function () {
        expect(await this.token.isOperatorFor(newOperator, holder)).to.equal(false);

        const { logs } = await this.token.authorizeOperator(newOperator, { from: holder });
        expectEvent.inLogs(logs, 'AuthorizedOperator', { operator: newOperator, tokenHolder: holder });

        expect(await this.token.isOperatorFor(newOperator, holder)).to.equal(true);
      });

      describe('new operators', function () {
        beforeEach(async function () {
          await this.token.authorizeOperator(newOperator, { from: holder });
        });

        it('are not added to the default operators list', async function () {
          expect(await this.token.defaultOperators()).to.deep.equal(defaultOperators);
        });

        it('can be re-authorized', async function () {
          const { logs } = await this.token.authorizeOperator(newOperator, { from: holder });
          expectEvent.inLogs(logs, 'AuthorizedOperator', { operator: newOperator, tokenHolder: holder });

          expect(await this.token.isOperatorFor(newOperator, holder)).to.equal(true);
        });

        it('can be revoked', async function () {
          const { logs } = await this.token.revokeOperator(newOperator, { from: holder });
          expectEvent.inLogs(logs, 'RevokedOperator', { operator: newOperator, tokenHolder: holder });

          expect(await this.token.isOperatorFor(newOperator, holder)).to.equal(false);
        });
      });

      describe('default operators', function () {
        it('can be re-authorized', async function () {
          const { logs } = await this.token.authorizeOperator(defaultOperatorA, { from: holder });
          expectEvent.inLogs(logs, 'AuthorizedOperator', { operator: defaultOperatorA, tokenHolder: holder });

          expect(await this.token.isOperatorFor(defaultOperatorA, holder)).to.equal(true);
        });

        it('can be revoked', async function () {
          const { logs } = await this.token.revokeOperator(defaultOperatorA, { from: holder });
          expectEvent.inLogs(logs, 'RevokedOperator', { operator: defaultOperatorA, tokenHolder: holder });

          expect(await this.token.isOperatorFor(defaultOperatorA, holder)).to.equal(false);
        });

        it('cannot be revoked for themselves', async function () {
          await expectRevert(
            this.token.revokeOperator(defaultOperatorA, { from: defaultOperatorA }),
            'ERC777: revoking self as operator'
          );
        });

        context('with revoked default operator', function () {
          beforeEach(async function () {
            await this.token.revokeOperator(defaultOperatorA, { from: holder });
          });

          it('default operator is not revoked for other holders', async function () {
            expect(await this.token.isOperatorFor(defaultOperatorA, anyone)).to.equal(true);
          });

          it('other default operators are not revoked', async function () {
            expect(await this.token.isOperatorFor(defaultOperatorB, holder)).to.equal(true);
          });

          it('default operators list is not modified', async function () {
            expect(await this.token.defaultOperators()).to.deep.equal(defaultOperators);
          });

          it('revoked default operator can be re-authorized', async function () {
            const { logs } = await this.token.authorizeOperator(defaultOperatorA, { from: holder });
            expectEvent.inLogs(logs, 'AuthorizedOperator', { operator: defaultOperatorA, tokenHolder: holder });

            expect(await this.token.isOperatorFor(defaultOperatorA, holder)).to.equal(true);
          });
        });
      });
    });

    describe('send and receive hooks', function () {
      const amount = new BN('1');
      const operator = defaultOperatorA;
      // sender and recipient are stored inside 'this', since in some tests their addresses are determined dynamically

      describe('tokensReceived', function () {
        beforeEach(function () {
          this.sender = holder;
        });

        context('with no ERC777TokensRecipient implementer', function () {
          context('with contract recipient', function () {
            beforeEach(async function () {
              this.tokensRecipientImplementer = await ERC777SenderRecipientMock.new();
              this.recipient = this.tokensRecipientImplementer.address;

              // Note that tokensRecipientImplementer doesn't implement the recipient interface for the recipient
            });

            it('send reverts', async function () {
              await expectRevert(
                this.token.send(this.recipient, amount, data, { from: holder }),
                'ERC777: token recipient contract has no implementer for ERC777TokensRecipient',
              );
            });

            it('operatorSend reverts', async function () {
              await expectRevert(
                this.token.operatorSend(this.sender, this.recipient, amount, data, operatorData, { from: operator }),
                'ERC777: token recipient contract has no implementer for ERC777TokensRecipient',
              );
            });

            it('mint (internal) reverts', async function () {
              await expectRevert(
                this.token.mintInternal(this.recipient, amount, data, operatorData, { from: operator }),
                'ERC777: token recipient contract has no implementer for ERC777TokensRecipient',
              );
            });

            it('(ERC20) transfer succeeds', async function () {
              await this.token.transfer(this.recipient, amount, { from: holder });
            });

            it('(ERC20) transferFrom succeeds', async function () {
              const approved = anyone;
              await this.token.approve(approved, amount, { from: this.sender });
              await this.token.transferFrom(this.sender, this.recipient, amount, { from: approved });
            });
          });
        });

        context('with ERC777TokensRecipient implementer', function () {
          context('with contract as implementer for an externally owned account', function () {
            beforeEach(async function () {
              this.tokensRecipientImplementer = await ERC777SenderRecipientMock.new();
              this.recipient = anyone;

              await this.tokensRecipientImplementer.recipientFor(this.recipient);

              await this.erc1820.setInterfaceImplementer(
                this.recipient,
                web3.utils.soliditySha3('ERC777TokensRecipient'), this.tokensRecipientImplementer.address,
                { from: this.recipient },
              );
            });

            shouldBehaveLikeERC777SendBurnMintInternalWithReceiveHook(operator, amount, data, operatorData);
          });

          context('with contract as implementer for another contract', function () {
            beforeEach(async function () {
              this.recipientContract = await ERC777SenderRecipientMock.new();
              this.recipient = this.recipientContract.address;

              this.tokensRecipientImplementer = await ERC777SenderRecipientMock.new();
              await this.tokensRecipientImplementer.recipientFor(this.recipient);
              await this.recipientContract.registerRecipient(this.tokensRecipientImplementer.address);
            });

            shouldBehaveLikeERC777SendBurnMintInternalWithReceiveHook(operator, amount, data, operatorData);
          });

          context('with contract as implementer for itself', function () {
            beforeEach(async function () {
              this.tokensRecipientImplementer = await ERC777SenderRecipientMock.new();
              this.recipient = this.tokensRecipientImplementer.address;

              await this.tokensRecipientImplementer.recipientFor(this.recipient);
            });

            shouldBehaveLikeERC777SendBurnMintInternalWithReceiveHook(operator, amount, data, operatorData);
          });
        });
      });

      describe('tokensToSend', function () {
        beforeEach(function () {
          this.recipient = anyone;
        });

        context('with a contract as implementer for an externally owned account', function () {
          beforeEach(async function () {
            this.tokensSenderImplementer = await ERC777SenderRecipientMock.new();
            this.sender = holder;

            await this.tokensSenderImplementer.senderFor(this.sender);

            await this.erc1820.setInterfaceImplementer(
              this.sender,
              web3.utils.soliditySha3('ERC777TokensSender'), this.tokensSenderImplementer.address,
              { from: this.sender },
            );
          });

          shouldBehaveLikeERC777SendBurnWithSendHook(operator, amount, data, operatorData);
        });

        context('with contract as implementer for another contract', function () {
          beforeEach(async function () {
            this.senderContract = await ERC777SenderRecipientMock.new();
            this.sender = this.senderContract.address;

            this.tokensSenderImplementer = await ERC777SenderRecipientMock.new();
            await this.tokensSenderImplementer.senderFor(this.sender);
            await this.senderContract.registerSender(this.tokensSenderImplementer.address);

            // For the contract to be able to receive tokens (that it can later send), it must also implement the
            // recipient interface.

            await this.senderContract.recipientFor(this.sender);
            await this.token.send(this.sender, amount, data, { from: holder });
          });

          shouldBehaveLikeERC777SendBurnWithSendHook(operator, amount, data, operatorData);
        });

        context('with a contract as implementer for itself', function () {
          beforeEach(async function () {
            this.tokensSenderImplementer = await ERC777SenderRecipientMock.new();
            this.sender = this.tokensSenderImplementer.address;

            await this.tokensSenderImplementer.senderFor(this.sender);

            // For the contract to be able to receive tokens (that it can later send), it must also implement the
            // recipient interface.

            await this.tokensSenderImplementer.recipientFor(this.sender);
            await this.token.send(this.sender, amount, data, { from: holder });
          });

          shouldBehaveLikeERC777SendBurnWithSendHook(operator, amount, data, operatorData);
        });
      });
    });
  });

  context('with no default operators', function () {
    beforeEach(async function () {
      this.token = await ERC777.new(holder, initialSupply, name, symbol, []);
    });

    it('default operators list is empty', async function () {
      expect(await this.token.defaultOperators()).to.deep.equal([]);
    });
  });
});
