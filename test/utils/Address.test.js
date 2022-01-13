const { balance, ether, expectRevert, send, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const AddressImpl = artifacts.require('AddressImpl');
const EtherReceiver = artifacts.require('EtherReceiverMock');
const CallReceiverMock = artifacts.require('CallReceiverMock');

contract('Address', function (accounts) {
  const [ recipient, other ] = accounts;

  beforeEach(async function () {
    this.mock = await AddressImpl.new();
  });

  describe('isContract', function () {
    it('returns false for account address', async function () {
      expect(await this.mock.isContract(other)).to.equal(false);
    });

    it('returns true for contract address', async function () {
      const contract = await AddressImpl.new();
      expect(await this.mock.isContract(contract.address)).to.equal(true);
    });
  });

  describe('sendValue', function () {
    beforeEach(async function () {
      this.recipientTracker = await balance.tracker(recipient);
    });

    context('when sender contract has no funds', function () {
      it('sends 0 wei', async function () {
        await this.mock.sendValue(other, 0);

        expect(await this.recipientTracker.delta()).to.be.bignumber.equal('0');
      });

      it('reverts when sending non-zero amounts', async function () {
        await expectRevert(this.mock.sendValue(other, 1), 'Address: insufficient balance');
      });
    });

    context('when sender contract has funds', function () {
      const funds = ether('1');
      beforeEach(async function () {
        await send.ether(other, this.mock.address, funds);
      });

      it('sends 0 wei', async function () {
        await this.mock.sendValue(recipient, 0);
        expect(await this.recipientTracker.delta()).to.be.bignumber.equal('0');
      });

      it('sends non-zero amounts', async function () {
        await this.mock.sendValue(recipient, funds.subn(1));
        expect(await this.recipientTracker.delta()).to.be.bignumber.equal(funds.subn(1));
      });

      it('sends the whole balance', async function () {
        await this.mock.sendValue(recipient, funds);
        expect(await this.recipientTracker.delta()).to.be.bignumber.equal(funds);
        expect(await balance.current(this.mock.address)).to.be.bignumber.equal('0');
      });

      it('reverts when sending more than the balance', async function () {
        await expectRevert(this.mock.sendValue(recipient, funds.addn(1)), 'Address: insufficient balance');
      });

      context('with contract recipient', function () {
        beforeEach(async function () {
          this.contractRecipient = await EtherReceiver.new();
        });

        it('sends funds', async function () {
          const tracker = await balance.tracker(this.contractRecipient.address);

          await this.contractRecipient.setAcceptEther(true);
          await this.mock.sendValue(this.contractRecipient.address, funds);
          expect(await tracker.delta()).to.be.bignumber.equal(funds);
        });

        it('reverts on recipient revert', async function () {
          await this.contractRecipient.setAcceptEther(false);
          await expectRevert(
            this.mock.sendValue(this.contractRecipient.address, funds),
            'Address: unable to send value, recipient may have reverted',
          );
        });
      });
    });
  });

  describe('functionCall', function () {
    beforeEach(async function () {
      this.contractRecipient = await CallReceiverMock.new();
    });

    context('with valid contract receiver', function () {
      it('calls the requested function', async function () {
        const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
          name: 'mockFunction',
          type: 'function',
          inputs: [],
        }, []);

        const receipt = await this.mock.functionCall(this.contractRecipient.address, abiEncodedCall);

        expectEvent(receipt, 'CallReturnValue', { data: '0x1234' });
        await expectEvent.inTransaction(receipt.tx, CallReceiverMock, 'MockFunctionCalled');
      });

      it('reverts when the called function reverts with no reason', async function () {
        const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
          name: 'mockFunctionRevertsNoReason',
          type: 'function',
          inputs: [],
        }, []);

        await expectRevert(
          this.mock.functionCall(this.contractRecipient.address, abiEncodedCall),
          'Address: low-level call failed',
        );
      });

      it('reverts when the called function reverts, bubbling up the revert reason', async function () {
        const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
          name: 'mockFunctionRevertsReason',
          type: 'function',
          inputs: [],
        }, []);

        await expectRevert(
          this.mock.functionCall(this.contractRecipient.address, abiEncodedCall),
          'CallReceiverMock: reverting',
        );
      });

      it('reverts when the called function runs out of gas', async function () {
        const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
          name: 'mockFunctionOutOfGas',
          type: 'function',
          inputs: [],
        }, []);

        await expectRevert(
          this.mock.functionCall(this.contractRecipient.address, abiEncodedCall, { gas: '100000' }),
          'Address: low-level call failed',
        );
      });

      it('reverts when the called function throws', async function () {
        const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
          name: 'mockFunctionThrows',
          type: 'function',
          inputs: [],
        }, []);

        await expectRevert.unspecified(
          this.mock.functionCall(this.contractRecipient.address, abiEncodedCall),
        );
      });

      it('reverts when function does not exist', async function () {
        const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
          name: 'mockFunctionDoesNotExist',
          type: 'function',
          inputs: [],
        }, []);

        await expectRevert(
          this.mock.functionCall(this.contractRecipient.address, abiEncodedCall),
          'Address: low-level call failed',
        );
      });
    });

    context('with non-contract receiver', function () {
      it('reverts when address is not a contract', async function () {
        const [ recipient ] = accounts;
        const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
          name: 'mockFunction',
          type: 'function',
          inputs: [],
        }, []);
        await expectRevert(this.mock.functionCall(recipient, abiEncodedCall), 'Address: call to non-contract');
      });
    });
  });

  describe('functionCallWithValue', function () {
    beforeEach(async function () {
      this.contractRecipient = await CallReceiverMock.new();
    });

    context('with zero value', function () {
      it('calls the requested function', async function () {
        const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
          name: 'mockFunction',
          type: 'function',
          inputs: [],
        }, []);

        const receipt = await this.mock.functionCallWithValue(this.contractRecipient.address, abiEncodedCall, 0);

        expectEvent(receipt, 'CallReturnValue', { data: '0x1234' });
        await expectEvent.inTransaction(receipt.tx, CallReceiverMock, 'MockFunctionCalled');
      });
    });

    context('with non-zero value', function () {
      const amount = ether('1.2');

      it('reverts if insufficient sender balance', async function () {
        const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
          name: 'mockFunction',
          type: 'function',
          inputs: [],
        }, []);

        await expectRevert(
          this.mock.functionCallWithValue(this.contractRecipient.address, abiEncodedCall, amount),
          'Address: insufficient balance for call',
        );
      });

      it('calls the requested function with existing value', async function () {
        const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
          name: 'mockFunction',
          type: 'function',
          inputs: [],
        }, []);

        const tracker = await balance.tracker(this.contractRecipient.address);

        await send.ether(other, this.mock.address, amount);
        const receipt = await this.mock.functionCallWithValue(this.contractRecipient.address, abiEncodedCall, amount);

        expect(await tracker.delta()).to.be.bignumber.equal(amount);

        expectEvent(receipt, 'CallReturnValue', { data: '0x1234' });
        await expectEvent.inTransaction(receipt.tx, CallReceiverMock, 'MockFunctionCalled');
      });

      it('calls the requested function with transaction funds', async function () {
        const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
          name: 'mockFunction',
          type: 'function',
          inputs: [],
        }, []);

        const tracker = await balance.tracker(this.contractRecipient.address);

        expect(await balance.current(this.mock.address)).to.be.bignumber.equal('0');
        const receipt = await this.mock.functionCallWithValue(
          this.contractRecipient.address, abiEncodedCall, amount, { from: other, value: amount },
        );

        expect(await tracker.delta()).to.be.bignumber.equal(amount);

        expectEvent(receipt, 'CallReturnValue', { data: '0x1234' });
        await expectEvent.inTransaction(receipt.tx, CallReceiverMock, 'MockFunctionCalled');
      });

      it('reverts when calling non-payable functions', async function () {
        const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
          name: 'mockFunctionNonPayable',
          type: 'function',
          inputs: [],
        }, []);

        await send.ether(other, this.mock.address, amount);
        await expectRevert(
          this.mock.functionCallWithValue(this.contractRecipient.address, abiEncodedCall, amount),
          'Address: low-level call with value failed',
        );
      });
    });
  });

  describe('functionStaticCall', function () {
    beforeEach(async function () {
      this.contractRecipient = await CallReceiverMock.new();
    });

    it('calls the requested function', async function () {
      const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
        name: 'mockStaticFunction',
        type: 'function',
        inputs: [],
      }, []);

      const receipt = await this.mock.functionStaticCall(this.contractRecipient.address, abiEncodedCall);

      expectEvent(receipt, 'CallReturnValue', { data: '0x1234' });
    });

    it('reverts on a non-static function', async function () {
      const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
        name: 'mockFunction',
        type: 'function',
        inputs: [],
      }, []);

      await expectRevert(
        this.mock.functionStaticCall(this.contractRecipient.address, abiEncodedCall),
        'Address: low-level static call failed',
      );
    });

    it('bubbles up revert reason', async function () {
      const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
        name: 'mockFunctionRevertsReason',
        type: 'function',
        inputs: [],
      }, []);

      await expectRevert(
        this.mock.functionStaticCall(this.contractRecipient.address, abiEncodedCall),
        'CallReceiverMock: reverting',
      );
    });

    it('reverts when address is not a contract', async function () {
      const [ recipient ] = accounts;
      const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
        name: 'mockFunction',
        type: 'function',
        inputs: [],
      }, []);
      await expectRevert(
        this.mock.functionStaticCall(recipient, abiEncodedCall),
        'Address: static call to non-contract',
      );
    });
  });

  describe.skip('functionDelegateCall', function () {
    beforeEach(async function () {
      this.contractRecipient = await CallReceiverMock.new();
    });

    it('delegate calls the requested function', async function () {
      const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
        name: 'mockFunctionWritesStorage',
        type: 'function',
        inputs: [],
      }, []);

      const receipt = await this.mock.functionDelegateCall(this.contractRecipient.address, abiEncodedCall);

      expectEvent(receipt, 'CallReturnValue', { data: '0x1234' });

      expect(await this.mock.sharedAnswer()).to.equal('42');
    });

    it('bubbles up revert reason', async function () {
      const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
        name: 'mockFunctionRevertsReason',
        type: 'function',
        inputs: [],
      }, []);

      await expectRevert(
        this.mock.functionDelegateCall(this.contractRecipient.address, abiEncodedCall),
        'CallReceiverMock: reverting',
      );
    });

    it('reverts when address is not a contract', async function () {
      const [ recipient ] = accounts;
      const abiEncodedCall = web3.eth.abi.encodeFunctionCall({
        name: 'mockFunction',
        type: 'function',
        inputs: [],
      }, []);
      await expectRevert(
        this.mock.functionDelegateCall(recipient, abiEncodedCall),
        'Address: delegate call to non-contract',
      );
    });
  });
});
