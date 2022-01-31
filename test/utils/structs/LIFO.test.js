const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Bytes32LIFOMock = artifacts.require('Bytes32LIFOMock');

contract('LIFO', function (accounts) {
  // Bytes32LIFO
  describe('Bytes32LIFO', function () {
    const bytesA = '0xdeadbeef'.padEnd(66, '0');
    const bytesB = '0x0123456789'.padEnd(66, '0');
    const bytesC = '0x42424242'.padEnd(66, '0');
    const bytesD = '0x171717'.padEnd(66, '0');

    beforeEach(async function () {
      this.lifo = await Bytes32LIFOMock.new();
    });

    it('empty lifo', async function () {
      expect(await this.lifo.empty()).to.be.equal(true);
      await expectRevert.unspecified(this.lifo.top());
      await expectRevert.unspecified(this.lifo.pop());
    });

    it('lifecycle', async function () {
      await this.lifo.push(bytesA);

      expect(await this.lifo.empty()).to.be.equal(false);
      expect(await this.lifo.top()).to.be.equal(bytesA);

      await this.lifo.push(bytesB);

      expect(await this.lifo.empty()).to.be.equal(false);
      expect(await this.lifo.top()).to.be.equal(bytesB);

      expectEvent(await this.lifo.pop(), 'OperationResult', { value: bytesB });

      expect(await this.lifo.empty()).to.be.equal(false);
      expect(await this.lifo.top()).to.be.equal(bytesA);

      await this.lifo.push(bytesC);

      expect(await this.lifo.empty()).to.be.equal(false);
      expect(await this.lifo.top()).to.be.equal(bytesC);

      expectEvent(await this.lifo.pop(), 'OperationResult', { value: bytesC });

      expect(await this.lifo.empty()).to.be.equal(false);
      expect(await this.lifo.top()).to.be.equal(bytesA);

      expectEvent(await this.lifo.pop(), 'OperationResult', { value: bytesA });

      expect(await this.lifo.empty()).to.be.equal(true);

      await this.lifo.push(bytesD);

      expect(await this.lifo.empty()).to.be.equal(false);
      expect(await this.lifo.top()).to.be.equal(bytesD);

      expectEvent(await this.lifo.pop(), 'OperationResult', { value: bytesD });

      expect(await this.lifo.empty()).to.be.equal(true);
    });
  });
});
