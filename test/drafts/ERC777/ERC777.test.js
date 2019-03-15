const {assertRevert} = require('../../helpers/assertRevert');
const expectEvent = require('../../helpers/expectEvent');
const {ERC1820Deploy} = require('../../introspection/ERC1820Deploy');

const ERC777 = artifacts.require('ERC777');
const ERC1820 = artifacts.require('IERC1820');
const ERC777TokensRecipient = artifacts.require('ERC777ReceiverMock');
const ERC777TokensSender = artifacts.require('ERC777SenderMock');

const BigNumber = web3.utils.BN;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC777', function ([_, holder, operator, anotherAccount]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const ERC1820_ADDRESS = "0x1820b744B33945482C17Dc37218C01D858EBc714";
  const INITIAL_SUPPLY = "10000";
  const USER_DATA = "0xabcd";
  const OPERATOR_DATA = "0x0a0b0c0d";
  const GRANULARITY = "1";

  before('Deploy ERC1820', async function () {
    try {
      this.ERC1820Registry = await ERC1820.at(ERC1820_ADDRESS);
    } catch(error) {
      let address = await ERC1820Deploy(holder);
      this.ERC1820Registry = await ERC1820.at(address);
    }
  });

  it('Minted event is emitted', async function () {
    // use web3 deployment to get the receipt
    let web3Contract = new web3.eth.Contract(ERC777.abi);
    web3Contract.options.data = ERC777.binary;
    let tx = web3Contract.deploy({arguments: ["Test777", "T77", GRANULARITY, [], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA]});

    let instance = await tx
    .send({from: holder, gas: '6000000', data: tx})
    .on('receipt', receipt => {
      expectEvent.inEvents(receipt.events, 'Minted',{
        operator: holder,
        to: holder,
        amount: INITIAL_SUPPLY,
        data: USER_DATA,
        operatorData: OPERATOR_DATA
      });
    });
    this.token = await ERC777.at(instance.options.address);
  });

  describe('ERC1820 Registry', function () {
    it('hardcoded address in ERC777 contract is correct', async function () {
      let erc1820 = await this.token.getERC1820Registry();
      erc1820.should.be.equal(this.ERC1820Registry.address);
    });
  });

  describe('total supply', function () {
    it('returns the total amount of tokens', async function () {
      (await this.token.totalSupply()).toString().should.be.equal(INITIAL_SUPPLY);
    });
  });

  describe('balanceOf', function () {
    describe('when the requested account has no tokens', function () {
      it('returns zero', async function () {
        (await this.token.balanceOf(anotherAccount)).toString().should.be.equal("0");
      });
    });

    describe('when the requested account has some tokens', function () {
      it('returns the total amount of tokens', async function () {
        (await this.token.balanceOf(holder)).toString().should.be.equal(INITIAL_SUPPLY);
      });
    });
  });

  describe('granularity', function () {
    it('returns granularity amount of the token', async function () {
      (await this.token.granularity()).toString().should.be.equal(GRANULARITY);
    });

    it('value is set at creation time', async function () {
      let tempToken = await ERC777.new("Test777", "T77", 10, [], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA);
      let granularity = await tempToken.granularity();
      granularity.toString().should.be.equal("10");
    });

    it('value is checked to be greater or equal to 1', async function () {
      await assertRevert(ERC777.new("Test777", "T77", 0, [], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA));
    });

    it('initialSupply is a multiple of granularity', async function () {
      await assertRevert(ERC777.new("Test777", "T77", "7", [], "11", USER_DATA, OPERATOR_DATA));
    });
  });

  describe('non-default operator', async function () {

    before('Deploy ERC777 with no default operator', async function () {
      this.token = await ERC777.new("Test777", "T77", 1, [], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA);
    });

    it('holder is an operator for itself', function () {
      assert(this.token.contract.methods.isOperatorFor(holder, holder));
    });

    describe('authorize operator', function () {

      it('AuthorizedOperator event is emitted', async function () {
        const {logs} = await this.token.authorizeOperator(anotherAccount, {from: holder});
        expectEvent.inLogs(logs, 'AuthorizedOperator', {
          operator: anotherAccount,
          tokenHolder: holder
        });
      });

      it('operator is authorized', function () {
        assert(this.token.contract.methods.isOperatorFor(anotherAccount, holder));
      });

      it('AuthorizedOperator event is emitted even if operator is already authorized', async function () {
        const {logs} = await this.token.authorizeOperator(anotherAccount, {from: holder});
        expectEvent.inLogs(logs, 'AuthorizedOperator', {
          operator: anotherAccount,
          tokenHolder: holder
        });
      });

      it('revert when token holder authorizes itself as operator', async function () {
        await assertRevert(this.token.authorizeOperator(holder, {from: holder}));
      });

    });

    describe('revoke operator', function () {
      
      it('RevokedOperator event is emitted', async function () {
        const {logs} = await this.token.revokeOperator(anotherAccount, {from: holder});
        expectEvent.inLogs(logs, 'RevokedOperator', {
          operator: anotherAccount,
          tokenHolder: holder
        });
      });

      it('operator is revoked', async function () {
        let iopf = await this.token.contract.methods.isOperatorFor(anotherAccount, holder).call();
        assert(! iopf);
      });

      it('RevokedOperator event is emitted even if operator is already revoked', async function () {
        const {logs} = await this.token.revokeOperator(anotherAccount, {from: holder});
        expectEvent.inLogs(logs, 'RevokedOperator', {
          operator: anotherAccount,
          tokenHolder: holder
        });
      });

      it('revert when token holder revoke itself as operator', async function () {
        await assertRevert(this.token.revokeOperator(holder, {from: holder}));
      });

    });
  });

  describe('default operator', async function () {

    before('Deploy ERC777 with one default operator', async function () {
      this.token = await ERC777.new("Test777", "T77", 1, [operator], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA);
    });

    it('returns empty array when no default operator has been declared', async function () {
      let tempToken = await ERC777.new("Test777", "T77", 1, [], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA);
      (await tempToken.defaultOperators()).should.be.an('array').that.is.empty;
    });

    it('array of operators is set at creation time', async function () {
      let tempToken = await ERC777.new("Test777", "T77", 1, [operator, anotherAccount], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA);
      let defaultOps = await tempToken.defaultOperators();
      defaultOps.should.be.an('array').that.has.all.members([operator, anotherAccount]);
    });

    it('operator is an authorized operator for any holder', function () {
      assert(this.token.contract.methods.isOperatorFor(operator, holder));
    });

    describe('revoke operator', function () {
      
      it('RevokedOperator event is emitted', async function () {
        const {logs} = await this.token.revokeOperator(operator, {from: holder});
        expectEvent.inLogs(logs, 'RevokedOperator', {
          operator: operator,
          tokenHolder: holder
        });
      });

      it('operator is revoked', async function () {
        let iopf = await this.token.contract.methods.isOperatorFor(operator, holder).call();
        assert(! iopf);
      });

      it('RevokedOperator event is emitted even if operator is already revoked', async function () {
        const {logs} = await this.token.revokeOperator(operator, {from: holder});
        expectEvent.inLogs(logs, 'RevokedOperator', {
          operator: operator,
          tokenHolder: holder
        });
      });

    });

    describe('re-authorize operator', function () {
    
      it('AuthorizedOperator event is emitted', async function () {
        const {logs} = await this.token.authorizeOperator(operator, {from: holder});
        expectEvent.inLogs(logs, 'AuthorizedOperator', {
          operator: operator,
          tokenHolder: holder
        });
      });

      it('operator is authorized', async function () {
        let iopf = await this.token.contract.methods.isOperatorFor(operator, holder).call();
        assert(iopf);
      });

      it('AuthorizedOperator is emitted even if operator is already authorized', async function () {
        const {logs} = await this.token.authorizeOperator(operator, {from: holder});
        expectEvent.inLogs(logs, 'AuthorizedOperator', {
          operator: operator,
          tokenHolder: holder
        });
      });

    });
  });

  describe('send()',function () {
  
    before('Deploy ERC777', async function () {
      this.token = await ERC777.new("Test777", "T77", 1, [], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA, {from: holder});
    });

    it('Sent event is emitted when sending 0 token', async function () {
      let userData = "0xdeadbeef";

      const {events} = await this.token.contract.methods.send(operator, "0", userData).send({from: holder});
      expectEvent.inEvents(events, 'Sent', {
        operator: holder,
        from: holder,
        to: operator,
        amount: "0",
        data: userData,
      });
    });

    it('revert when sending an amount of token from an account with insufficient balance', async function () {
      let amount = parseInt(INITIAL_SUPPLY, 10) + 100;
      let userData = "0xdeadbeef";
      await assertRevert(this.token.contract.methods.send(operator, amount.toString(), userData).send({from: holder}));
    });

    describe('sending an amount of token from an account with sufficient balance', function () {
      it('Sent event is emitted', async function () {
        let userData = "0xdeadbeef";

        const {events} = await this.token.contract.methods.send(operator, "100", userData).send({from: holder});
        expectEvent.inEvents(events, 'Sent', {
          operator: holder,
          from: holder,
          to: operator,
          amount: "100",
          data: userData,
        });
      });

      it('sender balance is decreased', async function () {
        let balance = parseInt(INITIAL_SUPPLY, 10) - 100;
        (await this.token.balanceOf(holder)).toString().should.be.equal(balance.toString());
      });

      it('recipient balance is increased', async function () {
        (await this.token.balanceOf(operator)).toString().should.be.equal("100");
      });

      describe('hooks', function () {
        it('tokensToSend() hook is called when declared', async function () {
          let userData = "0xdeadbeef";

          // deploy sender contract and give tokens
          let sender = await ERC777TokensSender.new(true, this.token.address);
          await this.token.contract.methods.send(sender.address, "100", userData).send({from: holder});

          const {events} = await sender.contract.methods.sendTokens(operator, "100", userData).send({from: holder});
          expectEvent.inEvents(events, 'TokensToSend', {
            operator: sender.address,
            from: sender.address,
            to: operator,
            amount: "100",
            data: userData,
          });
        });

        it('tokensToSend() hook is not called when not declared', async function () {
          let userData = "0xdeadbeef";

          // deploy sender contract and give tokens
          let sender = await ERC777TokensSender.new(false, this.token.address);
          await this.token.contract.methods.send(sender.address, "100", userData).send({from: holder});

          const {events} = await sender.contract.methods.sendTokens(operator, "100", userData).send({from: holder});
          expect(events["tokensToSend"]).to.not.exist;
        });

        it('tokensReceived() hook is called when declared', async function () {
          let userData = "0xdeadbeef";

          let receiver = await ERC777TokensRecipient.new(true);
          await this.token.contract.methods.send(receiver.address, "100", userData).send({from: holder});
          let events = await receiver.getPastEvents("TokensReceived");
          events.length.should.be.not.equal(0);
          let event = events[0].returnValues;
          event.operator.should.be.equal(holder);
          event.from.should.be.equal(holder);
          event.to.should.be.equal(receiver.address);
          event.amount.toString().should.be.equal("100");
          event.data.should.be.equal(userData);
        });

        it('tokensReceived() hook is not called when not declared', async function () {
          let userData = "0xdeadbeef";

          let receiver = await ERC777TokensRecipient.new(false);
          await this.token.contract.methods.send(receiver.address, "100", userData).send({from: holder});
          let events = await receiver.getPastEvents("TokensReceived");
          events.length.should.be.equal(0);
        });
      });

      it('revert when sending an amount of token to address(0)', async function () {
        let userData = "0xdeadbeef";
        await assertRevert(this.token.contract.methods.send(ZERO_ADDRESS, "100", userData).send({from: holder}));
      });

      it('revert when sending an amount which is not a multiple of granularity', async function () {
        let userData = "0xdeadbeef";
        let tempToken = await ERC777.new("Test777", "T77", 10, [], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA, {from: holder});
        await assertRevert(tempToken.contract.methods.send(anotherAccount, "15", userData).send({from: holder}));
      });
    });

  });

  describe('operatorSend()',function () {
    let operatorTests = {
      defaultOperatorTest:
        {
          name: "default operator",
          deploy_fn: async function (holder, operator) {
            this.token =
              await ERC777.new(
                "Test777",
                "T77",
                1,
                [operator],
                INITIAL_SUPPLY,
                USER_DATA,
                OPERATOR_DATA,
                {from: holder}
            );
          },
          deploy_sender: async function (holder, operator, declareInterface) {
              // deploy sender contract and give tokens
              this.sender = await ERC777TokensSender.new(declareInterface, this.token.address);
              await this.token.contract.methods.send(this.sender.address, "100", web3.utils.asciiToHex("")).send({from: holder});
          }
        },
      nonDefaultOperatorTest:
        {
          name: "non-default operator",
          deploy_fn: async function (holder, operator) {
            this.token =
              await ERC777.new(
                "Test777",
                "T77",
                1,
                [],
                INITIAL_SUPPLY,
                USER_DATA,
                OPERATOR_DATA,
                {from: holder}
            );
            await this.token.authorizeOperator(operator, {from: holder});
          },
          deploy_sender: async function (holder, operator, declareInterface) {
              // deploy sender contract and give tokens
              this.sender = await ERC777TokensSender.new(declareInterface, this.token.address);
              await this.token.contract.methods.send(this.sender.address, "100", web3.utils.asciiToHex("")).send({from: holder});
              // declare operator
              await this.sender.contract.methods.authorizeOperator(operator).send({from: holder});
          }
        }
    };
  
    it('revert when msg.sender is not an operator', async function () {
      let tempToken = await ERC777.new("Test777", "T77", 1, [operator], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA, {from: holder});
      let userData = "0xdeadbeef";
      let opData = "0xbabecafe";
      await assertRevert(tempToken.contract.methods.operatorSend(holder, anotherAccount, "100", userData, opData).send({from: anotherAccount}));
    });

    for (let test in operatorTests) {

      describe('when operator is a ' + operatorTests[test].name, function () {

        before('Deploy ERC777', async function() {
          await operatorTests[test].deploy_fn.call(this, holder, operator);
        });

        it('Sent event is emitted when sending 0 token', async function () {
          let userData = "0xdeadbeef";
          let opData = "0xbabecafe";

          const {events} = await this.token.contract.methods.operatorSend(holder, anotherAccount, "0", userData, opData).send({from: operator});
          expectEvent.inEvents(events, 'Sent', {
            operator: operator,
            from: holder,
            to: anotherAccount,
            amount: "0",
            data: userData,
            operatorData: opData,
          });
        });

        it('revert when sending an amount of token from an account with insufficient balance', async function () {
          let amount = parseInt(INITIAL_SUPPLY, 10) + 100;
          let userData = "0xdeadbeef";
          let opData = "0xbabecafe";
          await assertRevert(this.token.contract.methods.operatorSend(holder, anotherAccount, amount.toString(), userData, opData).send({from: operator}));
        });

        describe('sending an amount of token from an account with sufficient balance', function () {
          it('Sent event is emitted', async function () {
            let userData = "0xdeadbeef";
            let opData = "0xbabecafe";

            const {events} = await this.token.contract.methods.operatorSend(holder, anotherAccount, "100", userData, opData).send({from: operator});
            expectEvent.inEvents(events, 'Sent', {
              operator: operator,
              from: holder,
              to: anotherAccount,
              amount: "100",
              data: userData,
              operatorData: opData,
            });
          });

          it('sender balance is decreased', async function () {
            let balance = parseInt(INITIAL_SUPPLY, 10) - 100;
            (await this.token.balanceOf(holder)).toString().should.be.equal(balance.toString());
          });

          it('recipient balance is increased', async function () {
            (await this.token.balanceOf(anotherAccount)).toString().should.be.equal("100");
          });

          it('revert when recipient is address(0)', async function () {
            let userData = "0xdeadbeef";
            let opData = "0xbabecafe";
            await assertRevert(this.token.contract.methods.operatorSend(holder, ZERO_ADDRESS, "100", userData, opData).send({from: operator}));
          });

          it('revert when sending an amount which is not a multiple of granularity', async function () {
            let userData = "0xdeadbeef";
            let opData = "0xbabecafe";
            let tempToken = await ERC777.new("Test777", "T77", 10, [operator], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA, {from: holder});
            await assertRevert(tempToken.contract.methods.operatorSend(holder, anotherAccount, "15", userData, opData).send({from: operator}));
          });

          it('operator is the holder when from is address(0)', async function () {
            let userData = "0xdeadbeef";
            let opData = "0xbabecafe";

            this.token.contract.methods.send(operator, "100", userData).send({from: holder}).then(async () => {
              const {events} = await this.token.contract.methods.operatorSend(ZERO_ADDRESS, anotherAccount, "100", userData, opData).send({from: operator});
              expectEvent.inEvents(events, 'Sent', {
                operator: operator,
                from: operator,
                to: anotherAccount,
                amount: "100",
                data: userData,
                operatorData: opData,
              });
            });
          });

          describe('hooks', function () {

            it('tokensToSend() hook is called when declared', async function () {
              let userData = "0xdeadbeef";
              let opData = "0xbabecafe";

              // deploy sender contract, declare operator and give tokens
              await operatorTests[test].deploy_sender.call(this, holder, operator, true);

              await this.token.contract.methods.operatorSend(this.sender.address, anotherAccount, "100", userData, opData).send({from: operator});
              let events = await this.sender.getPastEvents("TokensToSend");
              events.length.should.be.not.equal(0);
              let event = events[0].returnValues;
              event.operator.should.be.equal(operator);
              event.from.should.be.equal(this.sender.address);
              event.to.should.be.equal(anotherAccount);
              event.amount.toString().should.be.equal("100");
              event.data.should.be.equal(userData);
              event.operatorData.should.be.equal(opData);
            });

            it('tokensToSend() hook is not called when not declared', async function () {

              let userData = "0xdeadbeef";
              let opData = "0xbabecafe";

              // deploy sender contract, declare operator and give tokens
              await operatorTests[test].deploy_sender.call(this, holder, operator, false);

              await this.token.contract.methods.operatorSend(this.sender.address, anotherAccount, "100", userData, opData).send({from: operator});
              let events = await this.sender.getPastEvents("TokensToSend");
              expect(events["tokensToSend"]).to.not.exist;
            });

            it('tokensReceived() hook is called when declared', async function () {
              let userData = "0xdeadbeef";
              let opData = "0xbabecafe";

              let receiver = await ERC777TokensRecipient.new(true);
              await this.token.contract.methods.operatorSend(holder, receiver.address, "100", userData, opData).send({from: operator});
              let events = await receiver.getPastEvents("TokensReceived");
              events.length.should.be.not.equal(0);
              let event = events[0].returnValues;
              event.operator.should.be.equal(operator);
              event.from.should.be.equal(holder);
              event.to.should.be.equal(receiver.address);
              event.amount.toString().should.be.equal("100");
              event.data.should.be.equal(userData);
              event.operatorData.should.be.equal(opData);
            });

            it('tokensReceived() hook is not called when not declared', async function () {
              let userData = "0xdeadbeef";
              let opData = "0xbabecafe";

              let receiver = await ERC777TokensRecipient.new(false);
              await this.token.contract.methods.operatorSend(holder, receiver.address, "100", userData, opData).send({from: operator});
              let events = await receiver.getPastEvents("TokensReceived");
              expect(events["tokensReceived"]).to.not.exist;
            });
          });

        });
      });
    }
  });

  describe('burn()',function () {
  
    before('Deploy ERC777', async function () {
      this.token = await ERC777.new("Test777", "T77", 1, [], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA, {from: holder});
    });

    it('Burned event is emitted when burning 0 token', async function () {
      const {events} = await this.token.contract.methods.burn("0").send({from: holder});
      expectEvent.inEvents(events, 'Burned', {
        operator: holder,
        from: holder,
        amount: "0",
      });
    });

    it('revert when burning an amount of token from an account with insufficient balance', async function () {
      let amount = parseInt(INITIAL_SUPPLY, 10) + 100;
      await assertRevert(this.token.contract.methods.burn(amount.toString()).send({from: holder}));
    });

    describe('burning an amount of token from an account with sufficient balance', function () {
      it('Burned event is emitted', async function () {

        const {events} = await this.token.contract.methods.burn("100").send({from: holder});
        expectEvent.inEvents(events, 'Burned', {
          operator: holder,
          from: holder,
          amount: "100",
        });
      });

      it('holder balance is decreased', async function () {
        let balance = parseInt(INITIAL_SUPPLY, 10) - 100;
        (await this.token.balanceOf(holder)).toString().should.be.equal(balance.toString());
      });

      it('balance of 0x0 is not increased', async function () {
        (await this.token.balanceOf(ZERO_ADDRESS)).toString().should.be.equal("0");
      });

      it('totalSupply is decreased', async function () {
        let supply = parseInt(INITIAL_SUPPLY, 10) - 100;
        (await this.token.totalSupply()).toString().should.be.equal(supply.toString());
      });

      describe('hooks', function () {
        it('tokensToSend() hook is called when declared, and data is 0x00', async function () {
          // deploy sender contract and give tokens
          let sender = await ERC777TokensSender.new(true, this.token.address);
          await this.token.contract.methods.send(sender.address, "100", web3.utils.asciiToHex("")).send({from: holder});

          const {events} = await sender.contract.methods.burnTokens("100").send({from: holder});
          expectEvent.inEvents(events, 'TokensToSend', {
            operator: sender.address,
            from: sender.address,
            to: ZERO_ADDRESS,
            amount: "100",
            data: "0x00",
          });
        });

        it('tokensToSend() hook is not called when not declared', async function () {
          // deploy sender contract and give tokens
          let sender = await ERC777TokensSender.new(false, this.token.address);
          await this.token.contract.methods.send(sender.address, "100", web3.utils.asciiToHex("")).send({from: holder});

          const {events} = await sender.contract.methods.burnTokens("100").send({from: holder});
          expect(events["tokensToSend"]).to.not.exist;
        });
      });

      it('revert when sending an amount which is not a multiple of granularity', async function () {
        let tempToken = await ERC777.new("Test777", "T77", 10, [], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA, {from: holder});
        await assertRevert(tempToken.contract.methods.burn("15").send({from: holder}));
      });
    });
  });

  describe('operatorBurn()',function () {
    let operatorTests = {
      defaultOperatorTest:
        {
          name: "default operator",
          deploy_fn: async function (holder, operator) {
            this.token =
              await ERC777.new(
                "Test777",
                "T77",
                1,
                [operator],
                INITIAL_SUPPLY,
                USER_DATA,
                OPERATOR_DATA,
                {from: holder}
            );
          },
          deploy_sender: async function (holder, operator, declareInterface) {
              // deploy sender contract and give tokens
              this.sender = await ERC777TokensSender.new(declareInterface, this.token.address);
              await this.token.contract.methods.send(this.sender.address, "100", web3.utils.asciiToHex("")).send({from: holder});
          }
        },
      nonDefaultOperatorTest:
        {
          name: "non-default operator",
          deploy_fn: async function (holder, operator) {
            this.token =
              await ERC777.new(
                "Test777",
                "T77",
                1,
                [],
                INITIAL_SUPPLY,
                USER_DATA,
                OPERATOR_DATA,
                {from: holder}
            );
            await this.token.authorizeOperator(operator, {from: holder});
          },
          deploy_sender: async function (holder, operator, declareInterface) {
              // deploy sender contract and give tokens
              this.sender = await ERC777TokensSender.new(declareInterface, this.token.address);
              await this.token.contract.methods.send(this.sender.address, "100", web3.utils.asciiToHex("")).send({from: holder});
              // declare operator
              await this.sender.contract.methods.authorizeOperator(operator).send({from: holder});
          }
        }
    };
  
    it('revert when msg.sender is not an operator', async function () {
      let tempToken = await ERC777.new("Test777", "T77", 1, [operator], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA, {from: holder});
      let opData = "0xbabecafe";
      await assertRevert(tempToken.contract.methods.operatorBurn(holder, "100", opData).send({from: anotherAccount}));
    });

    for (let test in operatorTests) {

      describe('when operator is a ' + operatorTests[test].name, function () {

        before('Deploy ERC777', async function() {
          await operatorTests[test].deploy_fn.call(this, holder, operator);
        });

        it('Burned event is emitted when burning 0 token', async function () {
          let opData = "0xbabecafe";

          const {events} = await this.token.contract.methods.operatorBurn(holder, "0", opData).send({from: operator});
          expectEvent.inEvents(events, 'Burned', {
            operator: operator,
            from: holder,
            amount: "0",
            operatorData: opData,
          });
        });

        it('revert when burning an amount of token from an account with insufficient balance', async function () {
          let amount = parseInt(INITIAL_SUPPLY, 10) + 100;
          let opData = "0xbabecafe";
          await assertRevert(this.token.contract.methods.operatorBurn(holder, amount.toString(), opData).send({from: operator}));
        });

        describe('burning an amount of token from an account with sufficient balance', function () {
          it('Burned event is emitted', async function () {
            let opData = "0xbabecafe";

            const {events} = await this.token.contract.methods.operatorBurn(holder, "100", opData).send({from: operator});
            expectEvent.inEvents(events, 'Burned', {
              operator: operator,
              from: holder,
              amount: "100",
              operatorData: opData,
            });
          });

          it('holder balance is decreased', async function () {
            let balance = parseInt(INITIAL_SUPPLY, 10) - 100;
            (await this.token.balanceOf(holder)).toString().should.be.equal(balance.toString());
          });

          it('balance of 0x0 is not increased', async function () {
            (await this.token.balanceOf(ZERO_ADDRESS)).toString().should.be.equal("0");
          });

          it('totalSupply is decreased', async function () {
            let supply = parseInt(INITIAL_SUPPLY, 10) - 100;
            (await this.token.totalSupply()).toString().should.be.equal(supply.toString());
          });

          it('revert when burning an amount which is not a multiple of granularity', async function () {
            let opData = "0xbabecafe";
            let tempToken = await ERC777.new("Test777", "T77", 10, [operator], INITIAL_SUPPLY, USER_DATA, OPERATOR_DATA, {from: holder});
            await assertRevert(tempToken.contract.methods.operatorBurn(holder, "15", opData).send({from: operator}));
          });

          it('operator is the holder when from is address(0)', async function () {
            let opData = "0xbabecafe";

            await this.token.contract.methods.send(operator, "100", web3.utils.asciiToHex("")).send({from: holder});
            const {events} = await this.token.contract.methods.operatorBurn(ZERO_ADDRESS, "100", opData).send({from: operator});
            expectEvent.inEvents(events, 'Burned', {
              operator: operator,
              from: operator,
              amount: "100",
              operatorData: opData,
            });
          });

          describe('hooks', function () {

            it('tokensToSend() hook is called when declared', async function () {
              let opData = "0xbabecafe";

              // deploy sender contract, declare operator and give tokens
              await operatorTests[test].deploy_sender.call(this, holder, operator, true);

              await this.token.contract.methods.operatorBurn(this.sender.address, "100", opData).send({from: operator});
              let events = await this.sender.getPastEvents("TokensToSend");
              events.length.should.be.not.equal(0);
              let event = events[0].returnValues;
              event.operator.should.be.equal(operator);
              event.from.should.be.equal(this.sender.address);
              event.amount.toString().should.be.equal("100");
              expect(event.data).to.not.exist;
              event.operatorData.should.be.equal(opData);
            });

            it('tokensToSend() hook is not called when not declared', async function () {

              let opData = "0xbabecafe";

              // deploy sender contract, declare operator and give tokens
              await operatorTests[test].deploy_sender.call(this, holder, operator, false);

              await this.token.contract.methods.operatorBurn(this.sender.address, "100", opData).send({from: operator});
              let events = await this.sender.getPastEvents("TokensToSend");
              expect(events["tokensToSend"]).to.not.exist;
            });
          });
        });
      });
    }
  });

});
