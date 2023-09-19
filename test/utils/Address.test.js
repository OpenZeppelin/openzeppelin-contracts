const { balance, constants, ether, expectRevert, send, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { expectRevertCustomError } = require('../helpers/customError');

const Address = artifacts.require('$Address');
const EtherReceiver = artifacts.require('EtherReceiverMock');
const CallReceiverMock = artifacts.require('CallReceiverMock');

contract('Address', function (accounts) {
  const [recipient, other] = accounts;

  beforeEach(async function () {
    this.mock = await Address.new();
  });

  describe('sendValue', function () {
    beforeEach(async function () {
      this.recipientTracker = await balance.tracker(recipient);
    });

    context('when sender contract has no funds', function () {
      it('sends 0 wei', async function () {
        await this.mock.$sendValue(other, 0);

        expect(await this.recipientTracker.delta()).to.be.bignumber.equal('0');
      });

      it('reverts when sending non-zero amounts', async function () {
        await expectRevertCustomError(this.mock.$sendValue(other, 1), 'AddressInsufficientBalance', [
          this.mock.address,
        ]);
      });
    });

    context('when sender contract has funds', function () {
      const funds = ether('1');
      beforeEach(async function () {
        await send.ether(other, this.mock.address, funds);
      });

      it('sends 0 wei', async function () {
        await this.mock.$sendValue(recipient, 0);
        expect(await this.recipientTracker.delta()).to.be.bignumber.equal('0');
      });

      it('sends non-zero amounts', async function () {
        await this.mock.$sendValue(recipient, funds.subn(1));
        expect(await this.recipientTracker.delta()).to.be.bignumber.equal(funds.subn(1));
      });

      it('sends the whole balance', async function () {
        await this.mock.$sendValue(recipient, funds);
        expect(await this.recipientTracker.delta()).to.be.bignumber.equal(funds);
        expect(await balance.current(this.mock.address)).to.be.bignumber.equal('0');
      });

      it('reverts when sending more than the balance', async function () {
        await expectRevertCustomError(this.mock.$sendValue(recipient, funds.addn(1)), 'AddressInsufficientBalance', [
          this.mock.address,
        ]);
      });

      context('with contract recipient', function () {
        beforeEach(async function () {
          this.target = await EtherReceiver.new();
        });

        it('sends funds', async function () {
          const tracker = await balance.tracker(this.target.address);

          await this.target.setAcceptEther(true);
          await this.mock.$sendValue(this.target.address, funds);

          expect(await tracker.delta()).to.be.bignumber.equal(funds);
        });

        it('reverts on recipient revert', async function () {
          await this.target.setAcceptEther(false);
          await expectRevertCustomError(this.mock.$sendValue(this.target.address, funds), 'FailedInnerCall', []);
        });
      });
    });
  });

  describe('functionCall', function () {
    beforeEach(async function () {
      this.target = await CallReceiverMock.new();
    });

    context('with valid contract receiver', function () {
      it('calls the requested function', async function () {
        const abiEncodedCall = this.target.contract.methods.mockFunction().encodeABI();

        const receipt = await this.mock.$functionCall(this.target.address, abiEncodedCall);

        expectEvent(receipt, 'return$functionCall', {
          ret0: web3.eth.abi.encodeParameters(['string'], ['0x1234']),
        });
        await expectEvent.inTransaction(receipt.tx, CallReceiverMock, 'MockFunctionCalled');
      });

      it('calls the requested empty return function', async function () {
        const abiEncodedCall = this.target.contract.methods.mockFunctionEmptyReturn().encodeABI();

        const receipt = await this.mock.$functionCall(this.target.address, abiEncodedCall);

        await expectEvent.inTransaction(receipt.tx, CallReceiverMock, 'MockFunctionCalled');
      });

      it('reverts when the called function reverts with no reason', async function () {
        const abiEncodedCall = this.target.contract.methods.mockFunctionRevertsNoReason().encodeABI();

        await expectRevertCustomError(
          this.mock.$functionCall(this.target.address, abiEncodedCall),
          'FailedInnerCall',
          [],
        );
      });

      it('reverts when the called function reverts, bubbling up the revert reason', async function () {
        const abiEncodedCall = this.target.contract.methods.mockFunctionRevertsReason().encodeABI();

        await expectRevert(this.mock.$functionCall(this.target.address, abiEncodedCall), 'CallReceiverMock: reverting');
      });

      it('reverts when the called function runs out of gas', async function () {
        const abiEncodedCall = this.target.contract.methods.mockFunctionOutOfGas().encodeABI();

        await expectRevertCustomError(
          this.mock.$functionCall(this.target.address, abiEncodedCall, { gas: '120000' }),
          'FailedInnerCall',
          [],
        );
      });

      it('reverts when the called function throws', async function () {
        const abiEncodedCall = this.target.contract.methods.mockFunctionThrows().encodeABI();

        await expectRevert.unspecified(this.mock.$functionCall(this.target.address, abiEncodedCall));
      });

      it('reverts when function does not exist', async function () {
        const abiEncodedCall = web3.eth.abi.encodeFunctionCall(
          {
            name: 'mockFunctionDoesNotExist',
            type: 'function',
            inputs: [],
          },
          [],
        );

        await expectRevertCustomError(
          this.mock.$functionCall(this.target.address, abiEncodedCall),
          'FailedInnerCall',
          [],
        );
      });
    });

    context('with non-contract receiver', function () {
      it('reverts when address is not a contract', async function () {
        const [recipient] = accounts;
        const abiEncodedCall = this.target.contract.methods.mockFunction().encodeABI();

        await expectRevertCustomError(this.mock.$functionCall(recipient, abiEncodedCall), 'AddressEmptyCode', [
          recipient,
        ]);
      });
    });
  });

  describe('functionCallWithValue', function () {
    beforeEach(async function () {
      this.target = await CallReceiverMock.new();
    });

    context('with zero value', function () {
      it('calls the requested function', async function () {
        const abiEncodedCall = this.target.contract.methods.mockFunction().encodeABI();

        const receipt = await this.mock.$functionCallWithValue(this.target.address, abiEncodedCall, 0);
        expectEvent(receipt, 'return$functionCallWithValue', {
          ret0: web3.eth.abi.encodeParameters(['string'], ['0x1234']),
        });
        await expectEvent.inTransaction(receipt.tx, CallReceiverMock, 'MockFunctionCalled');
      });
    });

    context('with non-zero value', function () {
      const amount = ether('1.2');

      it('reverts if insufficient sender balance', async function () {
        const abiEncodedCall = this.target.contract.methods.mockFunction().encodeABI();

        await expectRevertCustomError(
          this.mock.$functionCallWithValue(this.target.address, abiEncodedCall, amount),
          'AddressInsufficientBalance',
          [this.mock.address],
        );
      });

      it('calls the requested function with existing value', async function () {
        const abiEncodedCall = this.target.contract.methods.mockFunction().encodeABI();

        const tracker = await balance.tracker(this.target.address);

        await send.ether(other, this.mock.address, amount);

        const receipt = await this.mock.$functionCallWithValue(this.target.address, abiEncodedCall, amount);
        expectEvent(receipt, 'return$functionCallWithValue', {
          ret0: web3.eth.abi.encodeParameters(['string'], ['0x1234']),
        });
        await expectEvent.inTransaction(receipt.tx, CallReceiverMock, 'MockFunctionCalled');

        expect(await tracker.delta()).to.be.bignumber.equal(amount);
      });

      it('calls the requested function with transaction funds', async function () {
        const abiEncodedCall = this.target.contract.methods.mockFunction().encodeABI();

        const tracker = await balance.tracker(this.target.address);

        expect(await balance.current(this.mock.address)).to.be.bignumber.equal('0');

        const receipt = await this.mock.$functionCallWithValue(this.target.address, abiEncodedCall, amount, {
          from: other,
          value: amount,
        });
        expectEvent(receipt, 'return$functionCallWithValue', {
          ret0: web3.eth.abi.encodeParameters(['string'], ['0x1234']),
        });
        await expectEvent.inTransaction(receipt.tx, CallReceiverMock, 'MockFunctionCalled');

        expect(await tracker.delta()).to.be.bignumber.equal(amount);
      });

      it('reverts when calling non-payable functions', async function () {
        const abiEncodedCall = this.target.contract.methods.mockFunctionNonPayable().encodeABI();

        await send.ether(other, this.mock.address, amount);
        await expectRevertCustomError(
          this.mock.$functionCallWithValue(this.target.address, abiEncodedCall, amount),
          'FailedInnerCall',
          [],
        );
      });
    });
  });

  describe('functionStaticCall', function () {
    beforeEach(async function () {
      this.target = await CallReceiverMock.new();
    });

    it('calls the requested function', async function () {
      const abiEncodedCall = this.target.contract.methods.mockStaticFunction().encodeABI();

      expect(await this.mock.$functionStaticCall(this.target.address, abiEncodedCall)).to.be.equal(
        web3.eth.abi.encodeParameters(['string'], ['0x1234']),
      );
    });

    it('reverts on a non-static function', async function () {
      const abiEncodedCall = this.target.contract.methods.mockFunction().encodeABI();

      await expectRevertCustomError(
        this.mock.$functionStaticCall(this.target.address, abiEncodedCall),
        'FailedInnerCall',
        [],
      );
    });

    it('bubbles up revert reason', async function () {
      const abiEncodedCall = this.target.contract.methods.mockFunctionRevertsReason().encodeABI();

      await expectRevert(
        this.mock.$functionStaticCall(this.target.address, abiEncodedCall),
        'CallReceiverMock: reverting',
      );
    });

    it('reverts when address is not a contract', async function () {
      const [recipient] = accounts;
      const abiEncodedCall = this.target.contract.methods.mockFunction().encodeABI();

      await expectRevertCustomError(this.mock.$functionStaticCall(recipient, abiEncodedCall), 'AddressEmptyCode', [
        recipient,
      ]);
    });
  });

  describe('functionDelegateCall', function () {
    beforeEach(async function () {
      this.target = await CallReceiverMock.new();
    });

    it('delegate calls the requested function', async function () {
      // pseudorandom values
      const slot = '0x93e4c53af435ddf777c3de84bb9a953a777788500e229a468ea1036496ab66a0';
      const value = '0x6a465d1c49869f71fb65562bcbd7e08c8044074927f0297127203f2a9924ff5b';

      const abiEncodedCall = this.target.contract.methods.mockFunctionWritesStorage(slot, value).encodeABI();

      expect(await web3.eth.getStorageAt(this.mock.address, slot)).to.be.equal(constants.ZERO_BYTES32);

      expectEvent(
        await this.mock.$functionDelegateCall(this.target.address, abiEncodedCall),
        'return$functionDelegateCall',
        { ret0: web3.eth.abi.encodeParameters(['string'], ['0x1234']) },
      );

      expect(await web3.eth.getStorageAt(this.mock.address, slot)).to.be.equal(value);
    });

    it('bubbles up revert reason', async function () {
      const abiEncodedCall = this.target.contract.methods.mockFunctionRevertsReason().encodeABI();

      await expectRevert(
        this.mock.$functionDelegateCall(this.target.address, abiEncodedCall),
        'CallReceiverMock: reverting',
      );
    });

    it('reverts when address is not a contract', async function () {
      const [recipient] = accounts;
      const abiEncodedCall = this.target.contract.methods.mockFunction().encodeABI();

      await expectRevertCustomError(this.mock.$functionDelegateCall(recipient, abiEncodedCall), 'AddressEmptyCode', [
        recipient,
      ]);
    });
  });

  describe('verifyCallResult', function () {
    it('returns returndata on success', async function () {
      const returndata = '0x123abc';
      expect(await this.mock.$verifyCallResult(true, returndata)).to.equal(returndata);
    });
  });
});
