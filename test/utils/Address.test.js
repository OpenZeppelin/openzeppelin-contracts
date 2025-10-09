const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

const coder = ethers.AbiCoder.defaultAbiCoder();

const fakeContract = { interface: ethers.Interface.from(['error SomeCustomErrorWithoutArgs()']) };
const returndata = fakeContract.interface.encodeErrorResult('SomeCustomErrorWithoutArgs');

async function fixture() {
  const [recipient, other] = await ethers.getSigners();

  const mock = await ethers.deployContract('$Address');
  const target = await ethers.deployContract('CallReceiverMock');
  const targetEther = await ethers.deployContract('EtherReceiverMock');

  return { recipient, other, mock, target, targetEther };
}

describe('Address', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('sendValue', function () {
    describe('when sender contract has no funds', function () {
      it('sends 0 wei', async function () {
        await expect(this.mock.$sendValue(this.other, 0n)).to.changeEtherBalance(this.recipient, 0n);
      });

      it('reverts when sending non-zero amounts', async function () {
        await expect(this.mock.$sendValue(this.other, 1n))
          .to.be.revertedWithCustomError(this.mock, 'InsufficientBalance')
          .withArgs(0n, 1n);
      });
    });

    describe('when sender contract has funds', function () {
      const funds = ethers.parseEther('1');

      beforeEach(async function () {
        await this.other.sendTransaction({ to: this.mock, value: funds });
      });

      describe('with EOA recipient', function () {
        it('sends 0 wei', async function () {
          await expect(this.mock.$sendValue(this.recipient, 0n)).to.changeEtherBalance(this.recipient, 0n);
        });

        it('sends non-zero amounts', async function () {
          await expect(this.mock.$sendValue(this.recipient, funds - 1n)).to.changeEtherBalance(
            this.recipient,
            funds - 1n,
          );
        });

        it('sends the whole balance', async function () {
          await expect(this.mock.$sendValue(this.recipient, funds)).to.changeEtherBalance(this.recipient, funds);
          expect(await ethers.provider.getBalance(this.mock)).to.equal(0n);
        });

        it('reverts when sending more than the balance', async function () {
          await expect(this.mock.$sendValue(this.recipient, funds + 1n))
            .to.be.revertedWithCustomError(this.mock, 'InsufficientBalance')
            .withArgs(funds, funds + 1n);
        });
      });

      describe('with contract recipient', function () {
        it('sends funds', async function () {
          await this.targetEther.setAcceptEther(true);
          await expect(this.mock.$sendValue(this.targetEther, funds)).to.changeEtherBalance(this.targetEther, funds);
        });

        it('reverts on recipient revert', async function () {
          await this.targetEther.setAcceptEther(false);
          await expect(this.mock.$sendValue(this.targetEther, funds)).to.be.revertedWithCustomError(
            this.mock,
            'FailedCall',
          );
        });
      });
    });
  });

  describe('functionCall', function () {
    describe('with valid contract receiver', function () {
      it('calls the requested function', async function () {
        const call = this.target.interface.encodeFunctionData('mockFunction');

        await expect(this.mock.$functionCall(this.target, call))
          .to.emit(this.target, 'MockFunctionCalled')
          .to.emit(this.mock, 'return$functionCall')
          .withArgs(coder.encode(['string'], ['0x1234']));
      });

      it('calls the requested empty return function', async function () {
        const call = this.target.interface.encodeFunctionData('mockFunctionEmptyReturn');

        await expect(this.mock.$functionCall(this.target, call)).to.emit(this.target, 'MockFunctionCalled');
      });

      it('reverts when the called function reverts with no reason', async function () {
        const call = this.target.interface.encodeFunctionData('mockFunctionRevertsNoReason');

        await expect(this.mock.$functionCall(this.target, call)).to.be.revertedWithCustomError(this.mock, 'FailedCall');
      });

      it('reverts when the called function reverts, bubbling up the revert reason', async function () {
        const call = this.target.interface.encodeFunctionData('mockFunctionRevertsReason');

        await expect(this.mock.$functionCall(this.target, call)).to.be.revertedWith('CallReceiverMock: reverting');
      });

      it('reverts when the called function runs out of gas', async function () {
        const call = this.target.interface.encodeFunctionData('mockFunctionOutOfGas');

        await expect(this.mock.$functionCall(this.target, call, { gasLimit: 120_000n })).to.be.revertedWithCustomError(
          this.mock,
          'FailedCall',
        );
      });

      it('reverts when the called function throws', async function () {
        const call = this.target.interface.encodeFunctionData('mockFunctionThrows');

        await expect(this.mock.$functionCall(this.target, call)).to.be.revertedWithPanic(PANIC_CODES.ASSERTION_ERROR);
      });

      it('reverts when function does not exist', async function () {
        const call = new ethers.Interface(['function mockFunctionDoesNotExist()']).encodeFunctionData(
          'mockFunctionDoesNotExist',
        );

        await expect(this.mock.$functionCall(this.target, call)).to.be.revertedWithCustomError(this.mock, 'FailedCall');
      });
    });

    describe('with non-contract receiver', function () {
      it('reverts when address is not a contract', async function () {
        const call = this.target.interface.encodeFunctionData('mockFunction');

        await expect(this.mock.$functionCall(this.recipient, call))
          .to.be.revertedWithCustomError(this.mock, 'AddressEmptyCode')
          .withArgs(this.recipient);
      });
    });
  });

  describe('functionCallWithValue', function () {
    describe('with zero value', function () {
      it('calls the requested function', async function () {
        const call = this.target.interface.encodeFunctionData('mockFunction');

        await expect(this.mock.$functionCallWithValue(this.target, call, 0n))
          .to.emit(this.target, 'MockFunctionCalled')
          .to.emit(this.mock, 'return$functionCallWithValue')
          .withArgs(coder.encode(['string'], ['0x1234']));
      });
    });

    describe('with non-zero value', function () {
      const value = ethers.parseEther('1.2');

      it('reverts if insufficient sender balance', async function () {
        const call = this.target.interface.encodeFunctionData('mockFunction');

        await expect(this.mock.$functionCallWithValue(this.target, call, value))
          .to.be.revertedWithCustomError(this.mock, 'InsufficientBalance')
          .withArgs(0n, value);
      });

      it('calls the requested function with existing value', async function () {
        await this.other.sendTransaction({ to: this.mock, value });

        const call = this.target.interface.encodeFunctionData('mockFunction');
        const tx = await this.mock.$functionCallWithValue(this.target, call, value);

        await expect(tx).to.changeEtherBalance(this.target, value);

        await expect(tx)
          .to.emit(this.target, 'MockFunctionCalled')
          .to.emit(this.mock, 'return$functionCallWithValue')
          .withArgs(coder.encode(['string'], ['0x1234']));
      });

      it('calls the requested function with transaction funds', async function () {
        expect(await ethers.provider.getBalance(this.mock)).to.equal(0n);

        const call = this.target.interface.encodeFunctionData('mockFunction');
        const tx = await this.mock.connect(this.other).$functionCallWithValue(this.target, call, value, { value });

        await expect(tx).to.changeEtherBalance(this.target, value);
        await expect(tx)
          .to.emit(this.target, 'MockFunctionCalled')
          .to.emit(this.mock, 'return$functionCallWithValue')
          .withArgs(coder.encode(['string'], ['0x1234']));
      });

      it('reverts when calling non-payable functions', async function () {
        await this.other.sendTransaction({ to: this.mock, value });

        const call = this.target.interface.encodeFunctionData('mockFunctionNonPayable');

        await expect(this.mock.$functionCallWithValue(this.target, call, value)).to.be.revertedWithCustomError(
          this.mock,
          'FailedCall',
        );
      });
    });
  });

  describe('functionStaticCall', function () {
    it('calls the requested function', async function () {
      const call = this.target.interface.encodeFunctionData('mockStaticFunction');

      expect(await this.mock.$functionStaticCall(this.target, call)).to.equal(coder.encode(['string'], ['0x1234']));
    });

    it('reverts on a non-static function', async function () {
      const call = this.target.interface.encodeFunctionData('mockFunction');

      await expect(this.mock.$functionStaticCall(this.target, call)).to.be.revertedWithCustomError(
        this.mock,
        'FailedCall',
      );
    });

    it('bubbles up revert reason', async function () {
      const call = this.target.interface.encodeFunctionData('mockFunctionRevertsReason');

      await expect(this.mock.$functionStaticCall(this.target, call)).to.be.revertedWith('CallReceiverMock: reverting');
    });

    it('reverts when address is not a contract', async function () {
      const call = this.target.interface.encodeFunctionData('mockFunction');

      await expect(this.mock.$functionStaticCall(this.recipient, call))
        .to.be.revertedWithCustomError(this.mock, 'AddressEmptyCode')
        .withArgs(this.recipient);
    });
  });

  describe('functionDelegateCall', function () {
    it('delegate calls the requested function', async function () {
      const slot = ethers.hexlify(ethers.randomBytes(32));
      const value = ethers.hexlify(ethers.randomBytes(32));

      const call = this.target.interface.encodeFunctionData('mockFunctionWritesStorage', [slot, value]);

      expect(await ethers.provider.getStorage(this.mock, slot)).to.equal(ethers.ZeroHash);

      await expect(await this.mock.$functionDelegateCall(this.target, call))
        .to.emit(this.mock, 'return$functionDelegateCall')
        .withArgs(coder.encode(['string'], ['0x1234']));

      expect(await ethers.provider.getStorage(this.mock, slot)).to.equal(value);
    });

    it('bubbles up revert reason', async function () {
      const call = this.target.interface.encodeFunctionData('mockFunctionRevertsReason');

      await expect(this.mock.$functionDelegateCall(this.target, call)).to.be.revertedWith(
        'CallReceiverMock: reverting',
      );
    });

    it('reverts when address is not a contract', async function () {
      const call = this.target.interface.encodeFunctionData('mockFunction');

      await expect(this.mock.$functionDelegateCall(this.recipient, call))
        .to.be.revertedWithCustomError(this.mock, 'AddressEmptyCode')
        .withArgs(this.recipient);
    });
  });

  describe('verifyCallResult', function () {
    it('returns returndata on success', async function () {
      await expect(this.mock.$verifyCallResult(true, returndata)).to.eventually.equal(returndata);
    });

    it('bubble returndata on failure', async function () {
      await expect(this.mock.$verifyCallResult(false, returndata)).to.be.revertedWithCustomError(
        fakeContract,
        'SomeCustomErrorWithoutArgs',
      );
    });

    it('standard error on failure without returndata', async function () {
      await expect(this.mock.$verifyCallResult(false, '0x')).to.be.revertedWithCustomError(this.mock, 'FailedCall');
    });
  });

  describe('verifyCallResultFromTarget', function () {
    it('success with non-empty returndata', async function () {
      await expect(this.mock.$verifyCallResultFromTarget(this.mock, true, returndata)).to.eventually.equal(returndata);
      await expect(this.mock.$verifyCallResultFromTarget(this.recipient, true, returndata)).to.eventually.equal(
        returndata,
      );
    });

    it('success with empty returndata', async function () {
      await expect(this.mock.$verifyCallResultFromTarget(this.mock, true, '0x')).to.eventually.equal('0x');
      await expect(this.mock.$verifyCallResultFromTarget(this.recipient, true, '0x'))
        .to.be.revertedWithCustomError(this.mock, 'AddressEmptyCode')
        .withArgs(this.recipient);
    });

    it('failure with non-empty returndata', async function () {
      await expect(this.mock.$verifyCallResultFromTarget(this.mock, false, returndata)).to.revertedWithCustomError(
        fakeContract,
        'SomeCustomErrorWithoutArgs',
      );
      await expect(this.mock.$verifyCallResultFromTarget(this.recipient, false, returndata)).to.revertedWithCustomError(
        fakeContract,
        'SomeCustomErrorWithoutArgs',
      );
    });

    it('failure with empty returndata', async function () {
      await expect(this.mock.$verifyCallResultFromTarget(this.mock, false, '0x')).to.be.revertedWithCustomError(
        this.mock,
        'FailedCall',
      );
      await expect(this.mock.$verifyCallResultFromTarget(this.recipient, false, '0x')).to.be.revertedWithCustomError(
        this.mock,
        'FailedCall',
      );
    });
  });
});
