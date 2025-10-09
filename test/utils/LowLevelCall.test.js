const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const value = ethers.parseEther('1');
const returnValue1 = ethers.id('hello');
const returnValue2 = ethers.id('world');
const storageSlot = ethers.id('location');
const storageValue = ethers.id('data');

async function fixture() {
  const [account] = await ethers.getSigners();

  const mock = await ethers.deployContract('$LowLevelCall');
  const target = await ethers.deployContract('CallReceiverMock');

  return { account, mock, target };
}

describe('LowLevelCall', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('call', function () {
    describe('without any return', function () {
      it('calls the requested function and returns true', async function () {
        await expect(this.mock.$callNoReturn(this.target, this.target.interface.encodeFunctionData('mockFunction')))
          .to.emit(this.target, 'MockFunctionCalled')
          .to.emit(this.mock, 'return$callNoReturn_address_bytes')
          .withArgs(true);
      });

      it('calls the requested function with value and returns true', async function () {
        await this.account.sendTransaction({ to: this.mock, value });

        const tx = this.mock.$callNoReturn(
          this.target,
          ethers.Typed.uint256(value),
          this.target.interface.encodeFunctionData('mockFunction'),
        );
        await expect(tx).to.changeEtherBalances([this.mock, this.target], [-value, value]);
        await expect(tx).to.emit(this.mock, 'return$callNoReturn_address_uint256_bytes').withArgs(true);
      });

      it("calls the requested function and returns false if the caller doesn't have enough balance", async function () {
        const tx = this.mock.$callNoReturn(
          this.target,
          ethers.Typed.uint256(value),
          this.target.interface.encodeFunctionData('mockFunction'),
        );
        await expect(tx).to.changeEtherBalances([this.mock, this.target], [0n, 0n]);
        await expect(tx).to.emit(this.mock, 'return$callNoReturn_address_uint256_bytes').withArgs(false);
      });

      it('calls the requested function and returns false if the subcall reverts', async function () {
        const tx = this.mock.$callNoReturn(
          this.target,
          this.target.interface.encodeFunctionData('mockFunctionRevertsNoReason'),
        );
        await expect(tx).to.emit(this.mock, 'return$callNoReturn_address_bytes').withArgs(false);
      });
    });

    describe('with 64 bytes return in the scratch space', function () {
      it('calls the requested function and returns true', async function () {
        await expect(
          this.mock.$callReturn64Bytes(
            this.target,
            this.target.interface.encodeFunctionData('mockFunctionWithArgsReturn', [returnValue1, returnValue2]),
          ),
        )
          .to.emit(this.target, 'MockFunctionCalledWithArgs')
          .withArgs(returnValue1, returnValue2)
          .to.emit(this.mock, 'return$callReturn64Bytes_address_bytes')
          .withArgs(true, returnValue1, returnValue2);
      });

      it('calls the requested function with value and returns true', async function () {
        await this.account.sendTransaction({ to: this.mock, value });

        const tx = this.mock.$callReturn64Bytes(
          this.target,
          ethers.Typed.uint256(value),
          this.target.interface.encodeFunctionData('mockFunctionWithArgsReturn', [returnValue1, returnValue2]),
        );
        await expect(tx).to.changeEtherBalances([this.mock, this.target], [-value, value]);
        await expect(tx)
          .to.emit(this.mock, 'return$callReturn64Bytes_address_uint256_bytes')
          .withArgs(true, returnValue1, returnValue2);
      });

      it("calls the requested function and returns false if the caller doesn't have enough balance", async function () {
        const tx = this.mock.$callReturn64Bytes(
          this.target,
          ethers.Typed.uint256(value),
          this.target.interface.encodeFunctionData('mockFunctionWithArgsReturn', [returnValue1, returnValue2]),
        );
        await expect(tx).to.changeEtherBalances([this.mock, this.target], [0n, 0n]);
        await expect(tx)
          .to.emit(this.mock, 'return$callReturn64Bytes_address_uint256_bytes')
          .withArgs(false, ethers.ZeroHash, ethers.ZeroHash);
      });

      it('calls the requested function and returns false if the subcall reverts', async function () {
        await expect(
          this.mock.$callReturn64Bytes(
            this.target,
            this.target.interface.encodeFunctionData('mockFunctionRevertsNoReason'),
          ),
        )
          .to.emit(this.mock, 'return$callReturn64Bytes_address_bytes')
          .withArgs(false, ethers.ZeroHash, ethers.ZeroHash);
      });

      it('returns the first 64 bytes of the revert reason or custom error if the subcall reverts', async function () {
        const encoded = ethers.Interface.from(['error Error(string)']).encodeErrorResult('Error', [
          'CallReceiverMock: reverting',
        ]);

        await expect(
          this.mock.$callReturn64Bytes(
            this.target,
            this.target.interface.encodeFunctionData('mockFunctionRevertsReason'),
          ),
        )
          .to.emit(this.mock, 'return$callReturn64Bytes_address_bytes')
          .withArgs(
            false,
            ethers.hexlify(ethers.getBytes(encoded).slice(0x00, 0x20)),
            ethers.hexlify(ethers.getBytes(encoded).slice(0x20, 0x40)),
          );
      });
    });
  });

  describe('staticcall', function () {
    describe('without any return', function () {
      it('calls the requested function and returns true', async function () {
        await expect(
          this.mock.$staticcallNoReturn(this.target, this.target.interface.encodeFunctionData('mockStaticFunction')),
        ).to.eventually.equal(true);
      });

      it('calls the requested function and returns false if the subcall reverts', async function () {
        await expect(
          this.mock.$staticcallNoReturn(
            this.target,
            this.target.interface.encodeFunctionData('mockFunctionRevertsNoReason'),
          ),
        ).to.eventually.equal(false);
      });
    });

    describe('with 64 bytes return in the scratch space', function () {
      it('calls the requested function and returns true', async function () {
        await expect(
          this.mock.$staticcallReturn64Bytes(
            this.target,
            this.target.interface.encodeFunctionData('mockStaticFunctionWithArgsReturn', [returnValue1, returnValue2]),
          ),
        ).to.eventually.deep.equal([true, returnValue1, returnValue2]);
      });

      it('calls the requested function and returns false if the subcall reverts', async function () {
        await expect(
          this.mock.$staticcallReturn64Bytes(
            this.target,
            this.target.interface.encodeFunctionData('mockFunctionRevertsNoReason'),
          ),
        ).to.eventually.deep.equal([false, ethers.ZeroHash, ethers.ZeroHash]);
      });

      it('returns the first 64 bytes of the revert reason or custom error if the subcall reverts', async function () {
        const encoded = ethers.Interface.from(['error Error(string)']).encodeErrorResult('Error', [
          'CallReceiverMock: reverting',
        ]);

        await expect(
          this.mock.$staticcallReturn64Bytes(
            this.target,
            this.target.interface.encodeFunctionData('mockFunctionRevertsReason'),
          ),
        ).to.eventually.deep.equal([
          false,
          ethers.hexlify(ethers.getBytes(encoded).slice(0x00, 0x20)),
          ethers.hexlify(ethers.getBytes(encoded).slice(0x20, 0x40)),
        ]);
      });
    });
  });

  describe('delegate', function () {
    describe('without any return', function () {
      it('calls the requested function and returns true', async function () {
        await expect(ethers.provider.getStorage(this.mock, storageSlot)).to.eventually.equal(ethers.ZeroHash);

        await expect(
          this.mock.$delegatecallNoReturn(
            this.target,
            this.target.interface.encodeFunctionData('mockFunctionWritesStorage', [storageSlot, storageValue]),
          ),
        )
          .to.emit(this.mock, 'return$delegatecallNoReturn')
          .withArgs(true);

        // check delegate call set storage correctly
        await expect(ethers.provider.getStorage(this.mock, storageSlot)).to.eventually.equal(storageValue);
      });

      it('calls the requested function and returns false if the subcall reverts', async function () {
        await expect(
          this.mock.$delegatecallNoReturn(
            this.target,
            this.target.interface.encodeFunctionData('mockFunctionRevertsNoReason'),
          ),
        )
          .to.emit(this.mock, 'return$delegatecallNoReturn')
          .withArgs(false);
      });
    });

    describe('with 64 bytes return in the scratch space', function () {
      it('calls the requested function and returns true', async function () {
        await expect(ethers.provider.getStorage(this.mock, storageSlot)).to.eventually.equal(ethers.ZeroHash);

        await expect(
          this.mock.$delegatecallReturn64Bytes(
            this.target,
            this.target.interface.encodeFunctionData('mockFunctionWithArgsReturnWritesStorage', [
              storageSlot,
              storageValue,
              returnValue1,
              returnValue2,
            ]),
          ),
        )
          .to.emit(this.mock, 'return$delegatecallReturn64Bytes')
          .withArgs(true, returnValue1, returnValue2);

        // check delegate call set storage correctly
        await expect(ethers.provider.getStorage(this.mock, storageSlot)).to.eventually.equal(storageValue);
      });

      it('calls the requested function and returns false if the subcall reverts', async function () {
        await expect(
          this.mock.$delegatecallReturn64Bytes(
            this.target,
            this.target.interface.encodeFunctionData('mockFunctionRevertsNoReason'),
          ),
        )
          .to.emit(this.mock, 'return$delegatecallReturn64Bytes')
          .withArgs(false, ethers.ZeroHash, ethers.ZeroHash);
      });
    });
  });
});
