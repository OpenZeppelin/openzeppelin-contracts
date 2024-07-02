const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const [recipient, other] = await ethers.getSigners();

  const mock = await ethers.deployContract('$LowLevelCall');
  const target = await ethers.deployContract('CallReceiverMock');
  const targetEther = await ethers.deployContract('EtherReceiverMock');

  return { recipient, other, mock, target, targetEther, value: BigInt(1e18) };
}

describe('LowLevelCall', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('callRaw', function () {
    beforeEach(function () {
      this.call = this.target.interface.encodeFunctionData('mockFunction');
    });

    it('calls the requested function and returns true', async function () {
      await expect(this.mock.$callRaw(this.target, this.call))
        .to.emit(this.target, 'MockFunctionCalled')
        .to.emit(this.mock, 'return$callRaw_address_bytes')
        .withArgs(true);
    });

    it('calls the requested function with value and returns true', async function () {
      await this.other.sendTransaction({ to: this.mock, value: this.value });

      const tx = this.mock['$callRaw(address,bytes,uint256)'](this.target, this.call, this.value);
      await expect(tx).to.changeEtherBalance(this.target, this.value);
      await expect(tx).to.emit(this.mock, 'return$callRaw_address_bytes_uint256').withArgs(true);
    });

    it("calls the requested function and returns false if the caller doesn't have enough balance", async function () {
      const tx = this.mock['$callRaw(address,bytes,uint256)'](this.target, this.call, this.value);
      await expect(tx).to.not.changeEtherBalance(this.target, this.value);
      await expect(tx).to.emit(this.mock, 'return$callRaw_address_bytes_uint256').withArgs(false);
    });

    it('calls the requested function and returns false if the subcall reverts', async function () {
      const call = this.target.interface.encodeFunctionData('mockFunctionRevertsNoReason');
      const tx = await this.mock.$callRaw(this.target, call);
      expect(tx).to.emit(this.mock, 'return$callRaw_address_bytes').withArgs(false);
    });
  });

  describe('callReturnBytes32', function () {
    beforeEach(function () {
      this.returnValue = ethers.id('returnDataBytes32');
      this.call = this.target.interface.encodeFunctionData('mockFunctionWithArgsReturn', [
        this.returnValue,
        ethers.ZeroHash,
      ]);
    });

    it('calls the requested function and returns true', async function () {
      await expect(this.mock.$callReturnBytes32(this.target, this.call))
        .to.emit(this.target, 'MockFunctionCalledWithArgs')
        .withArgs(this.returnValue, ethers.ZeroHash)
        .to.emit(this.mock, 'return$callReturnBytes32_address_bytes')
        .withArgs(true, this.returnValue);
    });

    it('calls the requested function with value and returns true', async function () {
      await this.other.sendTransaction({ to: this.mock, value: this.value });

      const tx = this.mock['$callReturnBytes32(address,bytes,uint256)'](this.target, this.call, this.value);
      await expect(tx).to.changeEtherBalance(this.target, this.value);
      await expect(tx)
        .to.emit(this.mock, 'return$callReturnBytes32_address_bytes_uint256')
        .withArgs(true, this.returnValue);
    });

    it("calls the requested function and returns false if the caller doesn't have enough balance", async function () {
      const tx = this.mock['$callReturnBytes32(address,bytes,uint256)'](this.target, this.call, this.value);
      await expect(tx).to.not.changeEtherBalance(this.target, this.value);
      await expect(tx)
        .to.emit(this.mock, 'return$callReturnBytes32_address_bytes_uint256')
        .withArgs(false, ethers.ZeroHash);
    });

    it('calls the requested function and returns false if the subcall reverts', async function () {
      const call = this.target.interface.encodeFunctionData('mockFunctionRevertsNoReason');
      const tx = await this.mock.$callReturnBytes32(this.target, call);
      expect(tx).to.emit(this.mock, 'return$callReturnBytes32_address_bytes').withArgs(false, ethers.ZeroHash);
    });
  });

  describe('callReturnBytes32Pair', function () {
    beforeEach(function () {
      this.returnValue1 = ethers.id('returnDataBytes32Pair1');
      this.returnValue2 = ethers.id('returnDataBytes32Pair2');
      this.call = this.target.interface.encodeFunctionData('mockFunctionWithArgsReturn', [
        this.returnValue1,
        this.returnValue2,
      ]);
    });

    it('calls the requested function and returns true', async function () {
      await expect(this.mock.$callReturnBytes32Pair(this.target, this.call))
        .to.emit(this.target, 'MockFunctionCalledWithArgs')
        .withArgs(this.returnValue1, this.returnValue2)
        .to.emit(this.mock, 'return$callReturnBytes32Pair_address_bytes')
        .withArgs(true, this.returnValue1, this.returnValue2);
    });

    it('calls the requested function with value and returns true', async function () {
      await this.other.sendTransaction({ to: this.mock, value: this.value });

      const tx = this.mock['$callReturnBytes32Pair(address,bytes,uint256)'](this.target, this.call, this.value);
      await expect(tx).to.changeEtherBalance(this.target, this.value);
      await expect(tx)
        .to.emit(this.mock, 'return$callReturnBytes32Pair_address_bytes_uint256')
        .withArgs(true, this.returnValue1, this.returnValue2);
    });

    it("calls the requested function and returns false if the caller doesn't have enough balance", async function () {
      const tx = this.mock['$callReturnBytes32Pair(address,bytes,uint256)'](this.target, this.call, this.value);
      await expect(tx).to.not.changeEtherBalance(this.target, this.value);
      await expect(tx)
        .to.emit(this.mock, 'return$callReturnBytes32Pair_address_bytes_uint256')
        .withArgs(false, ethers.ZeroHash, ethers.ZeroHash);
    });

    it('calls the requested function and returns false if the subcall reverts', async function () {
      const call = this.target.interface.encodeFunctionData('mockFunctionRevertsNoReason');
      const tx = await this.mock.$callReturnBytes32Pair(this.target, call);
      expect(tx)
        .to.emit(this.mock, 'return$callReturnBytes32Pair_address_bytes')
        .withArgs(false, ethers.ZeroHash, ethers.ZeroHash);
    });
  });

  describe('staticcallRaw', function () {
    it('calls the requested function and returns true', async function () {
      const call = this.target.interface.encodeFunctionData('mockStaticFunction');
      expect(await this.mock.$staticcallRaw(this.target, call)).to.equal(true);
    });

    it('calls the requested function and returns false if the subcall reverts', async function () {
      const interface = new ethers.Interface(['function mockFunctionDoesNotExist()']);

      const call = interface.encodeFunctionData('mockFunctionDoesNotExist');
      expect(await this.mock.$staticcallRaw(this.target, call)).to.equal(false);
    });
  });

  describe('staticcallReturnBytes32', function () {
    beforeEach(function () {
      this.returnValue = ethers.id('returnDataBytes32');
    });

    it('calls the requested function and returns true', async function () {
      const call = this.target.interface.encodeFunctionData('mockStaticFunctionWithArgsReturn', [
        this.returnValue,
        ethers.ZeroHash,
      ]);
      expect(await this.mock.$staticcallReturnBytes32(this.target, call)).to.deep.equal([true, this.returnValue]);
    });

    it('calls the requested function and returns false if the subcall reverts', async function () {
      const interface = new ethers.Interface(['function mockFunctionDoesNotExist()']);

      const call = interface.encodeFunctionData('mockFunctionDoesNotExist');
      expect(await this.mock.$staticcallReturnBytes32(this.target, call)).to.deep.equal([false, ethers.ZeroHash]);
    });
  });

  describe('staticcallReturnBytes32Pair', function () {
    beforeEach(function () {
      this.returnValue1 = ethers.id('returnDataBytes32Pair1');
      this.returnValue2 = ethers.id('returnDataBytes32Pair2');
    });

    it('calls the requested function and returns true', async function () {
      const call = this.target.interface.encodeFunctionData('mockStaticFunctionWithArgsReturn', [
        this.returnValue1,
        this.returnValue2,
      ]);
      expect(await this.mock.$staticcallReturnBytes32Pair(this.target, call)).to.deep.equal([
        true,
        this.returnValue1,
        this.returnValue2,
      ]);
    });

    it('calls the requested function and returns false if the subcall reverts', async function () {
      const interface = new ethers.Interface(['function mockFunctionDoesNotExist()']);

      const call = interface.encodeFunctionData('mockFunctionDoesNotExist');
      expect(await this.mock.$staticcallReturnBytes32Pair(this.target, call)).to.deep.equal([
        false,
        ethers.ZeroHash,
        ethers.ZeroHash,
      ]);
    });
  });
});
