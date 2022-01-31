const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Bytes32FIFOMock = artifacts.require('Bytes32FIFOMock');

contract('FIFO', function (accounts) {
  // Bytes32FIFO
  describe('Bytes32FIFO', function () {
    const bytesA = '0xdeadbeef'.padEnd(66, '0');
    const bytesB = '0x0123456789'.padEnd(66, '0');
    const bytesC = '0x42424242'.padEnd(66, '0');
    const bytesD = '0x171717'.padEnd(66, '0');

    beforeEach(async function () {
      this.fifo = await Bytes32FIFOMock.new();
    });

    it('empty fifo', async function () {
      expect(await this.fifo.empty()).to.be.equal(true);
      await expectRevert.unspecified(this.fifo.top());
      await expectRevert.unspecified(this.fifo.pop());
    });

    it('lifecycle', async function () {
      await this.fifo.push(bytesA);

      expect(await this.fifo.empty()).to.be.equal(false);
      expect(await this.fifo.top()).to.be.equal(bytesA);

      await this.fifo.push(bytesB);

      expect(await this.fifo.empty()).to.be.equal(false);
      expect(await this.fifo.top()).to.be.equal(bytesA);

      expectEvent(await this.fifo.pop(), 'OperationResult', { value: bytesA });

      expect(await this.fifo.empty()).to.be.equal(false);
      expect(await this.fifo.top()).to.be.equal(bytesB);

      await this.fifo.push(bytesC);

      expect(await this.fifo.empty()).to.be.equal(false);
      expect(await this.fifo.top()).to.be.equal(bytesB);

      expectEvent(await this.fifo.pop(), 'OperationResult', { value: bytesB });

      expect(await this.fifo.empty()).to.be.equal(false);
      expect(await this.fifo.top()).to.be.equal(bytesC);

      expectEvent(await this.fifo.pop(), 'OperationResult', { value: bytesC });

      expect(await this.fifo.empty()).to.be.equal(true);

      await this.fifo.push(bytesD);

      expect(await this.fifo.empty()).to.be.equal(false);
      expect(await this.fifo.top()).to.be.equal(bytesD);

      expectEvent(await this.fifo.pop(), 'OperationResult', { value: bytesD });

      expect(await this.fifo.empty()).to.be.equal(true);
    });
  });
});
