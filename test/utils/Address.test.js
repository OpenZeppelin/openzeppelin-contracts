const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const coder = ethers.AbiCoder.defaultAbiCoder();

async function fixture() {
  const [recipient, other] = await ethers.getSigners();

  const mock = await ethers.deployContract('$Address');
  const target = await ethers.deployContract('CallReceiverMock');

  return { recipient, other, mock, target };
}

describe.only('Address', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('sendValue', function () {
    describe('when sender contract has no funds', function () {
      it('sends 0 wei', async function () {
        await expect(this.mock.$sendValue(this.other, 0)).to.changeEtherBalance(this.recipient, 0);
      });

      it('reverts when sending non-zero amounts', async function () {
        await expect(this.mock.$sendValue(this.other, 1))
          .to.be.revertedWithCustomError(this.mock, 'AddressInsufficientBalance')
          .withArgs(this.mock.target);
      });
    });

    describe('when sender contract has funds', function () {
      const funds = ethers.parseEther('1');

      beforeEach(async function () {
        await this.other.sendTransaction({ to: this.mock, value: funds });
      });

      describe('with EOA recipient', async function () {
        it('sends 0 wei', async function () {
          await expect(this.mock.$sendValue(this.recipient, 0)).to.changeEtherBalance(this.recipient.address, 0);
        });

        it('sends non-zero amounts', async function () {
          await expect(this.mock.$sendValue(this.recipient, funds - 1n)).to.changeEtherBalance(
            this.recipient,
            funds - 1n,
          );
        });

        it('sends the whole balance', async function () {
          await expect(this.mock.$sendValue(this.recipient, funds)).to.changeEtherBalance(this.recipient, funds);
          expect(await ethers.provider.getBalance(this.mock)).to.be.equal('0');
        });

        it('reverts when sending more than the balance', async function () {
          await expect(this.mock.$sendValue(this.recipient, funds + 1n))
            .to.be.revertedWithCustomError(this.mock, 'AddressInsufficientBalance')
            .withArgs(this.mock.target);
        });
      });

      describe('with contract recipient', function () {
        beforeEach(async function () {
          this.target = await ethers.deployContract('EtherReceiverMock');
        });

        it('sends funds', async function () {
          await this.target.setAcceptEther(true);
          await expect(this.mock.$sendValue(this.target, funds)).to.changeEtherBalance(this.target, funds);
        });

        it('reverts on recipient revert', async function () {
          await this.target.setAcceptEther(false);
          await expect(this.mock.$sendValue(this.target, funds)).to.be.revertedWithCustomError(
            this.mock,
            'FailedInnerCall',
          );
        });
      });
    });
  });

  describe('functionCall', function () {
    describe('with valid contract receiver', function () {
      it('calls the requested function', async function () {
        const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunction');
        const tx = await this.mock.$functionCall(this.target, abiEncodedCall);

        await expect(tx)
          .to.emit(this.mock, 'return$functionCall')
          .withArgs(coder.encode(['string'], ['0x1234']));

        await expect(tx).to.emit(this.target, 'MockFunctionCalled');
      });

      it('calls the requested empty return function', async function () {
        const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunctionEmptyReturn');
        await expect(this.mock.$functionCall(this.target, abiEncodedCall)).to.emit(this.target, 'MockFunctionCalled');
      });

      it('reverts when the called function reverts with no reason', async function () {
        const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunctionRevertsNoReason');

        await expect(this.mock.$functionCall(this.target, abiEncodedCall)).to.be.revertedWithCustomError(
          this.mock,
          'FailedInnerCall',
        );
      });

      it('reverts when the called function reverts, bubbling up the revert reason', async function () {
        const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunctionRevertsReason');

        await expect(this.mock.$functionCall(this.target, abiEncodedCall)).to.be.revertedWith(
          'CallReceiverMock: reverting',
        );
      });

      it('reverts when the called function runs out of gas', async function () {
        const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunctionOutOfGas');

        await expect(
          this.mock.$functionCall(this.target, abiEncodedCall, { gas: '120000' }),
        ).to.be.revertedWithCustomError(this.mock, 'FailedInnerCall');
      });

      it('reverts when the called function throws', async function () {
        const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunctionThrows');

        await expect(this.mock.$functionCall(this.target, abiEncodedCall)).to.be.revertedWithPanic(0x01);
      });

      it('reverts when function does not exist', async function () {
        const target = new ethers.Interface(['function mockFunctionDoesNotExist()']);
        const abiEncodedCall = target.encodeFunctionData('mockFunctionDoesNotExist');

        await expect(this.mock.$functionCall(this.target, abiEncodedCall)).to.be.revertedWithCustomError(
          this.mock,
          'FailedInnerCall',
        );
      });
    });

    describe('with non-contract receiver', function () {
      it('reverts when address is not a contract', async function () {
        const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunction');

        await expect(this.mock.$functionCall(this.recipient, abiEncodedCall))
          .to.be.revertedWithCustomError(this.mock, 'AddressEmptyCode')
          .withArgs(this.recipient.address);
      });
    });
  });

  describe('functionCallWithValue', function () {
    describe('with zero value', function () {
      it('calls the requested function', async function () {
        const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunction');

        const tx = await this.mock.$functionCallWithValue(this.target, abiEncodedCall, 0);
        await expect(tx)
          .to.emit(this.mock, 'return$functionCallWithValue')
          .withArgs(coder.encode(['string'], ['0x1234']));
        await expect(tx).to.emit(this.target, 'MockFunctionCalled');
      });
    });

    describe('with non-zero value', function () {
      const amount = ethers.parseEther('1.2');

      it('reverts if insufficient sender balance', async function () {
        const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunction');

        await expect(this.mock.$functionCallWithValue(this.target, abiEncodedCall, amount))
          .to.be.revertedWithCustomError(this.mock, 'AddressInsufficientBalance')
          .withArgs(this.mock.target);
      });

      it('calls the requested function with existing value', async function () {
        const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunction');

        await this.other.sendTransaction({ to: this.mock, value: amount });

        const tx = await this.mock.$functionCallWithValue(this.target, abiEncodedCall, amount);
        await expect(tx)
          .to.emit(this.mock, 'return$functionCallWithValue')
          .withArgs(coder.encode(['string'], ['0x1234']));
        await expect(tx).to.emit(this.target, 'MockFunctionCalled');

        await expect(tx).to.changeEtherBalance(this.target, amount);
      });

      it('calls the requested function with transaction funds', async function () {
        const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunction');

        expect(await ethers.provider.getBalance(this.mock)).to.be.equal('0');

        const tx = await this.mock.connect(this.other).$functionCallWithValue(this.target, abiEncodedCall, amount, {
          value: amount,
        });
        await expect(tx)
          .to.emit(this.mock, 'return$functionCallWithValue')
          .withArgs(coder.encode(['string'], ['0x1234']));
        await expect(tx).to.emit(this.target, 'MockFunctionCalled');

        await expect(tx).to.changeEtherBalance(this.target, amount);
      });

      it('reverts when calling non-payable functions', async function () {
        const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunctionNonPayable');

        await this.other.sendTransaction({ to: this.mock, value: amount });
        await expect(
          this.mock.$functionCallWithValue(this.target, abiEncodedCall, amount),
        ).to.be.revertedWithCustomError(this.mock, 'FailedInnerCall');
      });
    });
  });

  describe('functionStaticCall', function () {
    it('calls the requested function', async function () {
      const abiEncodedCall = this.target.interface.encodeFunctionData('mockStaticFunction');

      expect(await this.mock.$functionStaticCall(this.target, abiEncodedCall)).to.be.equal(
        coder.encode(['string'], ['0x1234']),
      );
    });

    it('reverts on a non-static function', async function () {
      const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunction');

      await expect(this.mock.$functionStaticCall(this.target, abiEncodedCall)).to.be.revertedWithCustomError(
        this.mock,
        'FailedInnerCall',
      );
    });

    it('bubbles up revert reason', async function () {
      const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunctionRevertsReason');

      await expect(this.mock.$functionStaticCall(this.target, abiEncodedCall)).to.be.revertedWith(
        'CallReceiverMock: reverting',
      );
    });

    it('reverts when address is not a contract', async function () {
      const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunction');

      await expect(this.mock.$functionStaticCall(this.recipient, abiEncodedCall))
        .to.be.revertedWithCustomError(this.mock, 'AddressEmptyCode')
        .withArgs(this.recipient.address);
    });
  });

  describe('functionDelegateCall', function () {
    it('delegate calls the requested function', async function () {
      // pseudorandom values
      const slot = '0x93e4c53af435ddf777c3de84bb9a953a777788500e229a468ea1036496ab66a0';
      const value = '0x6a465d1c49869f71fb65562bcbd7e08c8044074927f0297127203f2a9924ff5b';

      const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunctionWritesStorage', [slot, value]);

      expect(await ethers.provider.getStorage(this.mock, slot)).to.be.equal(ethers.ZeroHash);

      await expect(await this.mock.$functionDelegateCall(this.target, abiEncodedCall))
        .to.emit(this.mock, 'return$functionDelegateCall')
        .withArgs(coder.encode(['string'], ['0x1234']));

      expect(await ethers.provider.getStorage(this.mock, slot)).to.be.equal(value);
    });

    it('bubbles up revert reason', async function () {
      const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunctionRevertsReason');

      await expect(this.mock.$functionDelegateCall(this.target, abiEncodedCall)).to.be.revertedWith(
        'CallReceiverMock: reverting',
      );
    });

    it('reverts when address is not a contract', async function () {
      const abiEncodedCall = this.target.interface.encodeFunctionData('mockFunction');

      await expect(this.mock.$functionDelegateCall(this.recipient, abiEncodedCall))
        .to.be.revertedWithCustomError(this.mock, 'AddressEmptyCode')
        .withArgs(this.recipient.address);
    });
  });

  describe('verifyCallResult', function () {
    it('returns returndata on success', async function () {
      const returndata = '0x123abc';
      expect(await this.mock.$verifyCallResult(true, returndata)).to.equal(returndata);
    });
  });
});
