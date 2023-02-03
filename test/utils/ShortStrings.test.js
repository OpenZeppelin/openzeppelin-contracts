const { expect } = require('chai');
const { expectRevertCustomError } = require('../helpers/customError');

const ShortStrings = artifacts.require('$ShortStrings');

function decode(sstr) {
  const length = parseInt(sstr.slice(64), 16);
  return web3.utils.toUtf8(sstr).slice(0, length);
}

contract('ShortStrings', function () {
  before(async function () {
    this.mock = await ShortStrings.new();
  });

  for (const str of [0, 1, 16, 31, 32, 64, 1024].map(length => 'a'.repeat(length))) {
    describe(`with string length ${str.length}`, function () {
      it('encode / decode', async function () {
        if (str.length < 32) {
          const encoded = await this.mock.$toShortString(str);
          expect(decode(encoded)).to.be.equal(str);

          const length = await this.mock.$length(encoded);
          expect(length.toNumber()).to.be.equal(str.length);

          const decoded = await this.mock.$toString(encoded);
          expect(decoded).to.be.equal(str);
        } else {
          await expectRevertCustomError(this.mock.$toShortString(str), `StringTooLong("${str}")`);
        }
      });

      it('set / get with fallback', async function () {
        const { logs } = await this.mock.$toShortStringWithFallback(str, 0);
        const { ret0 } = logs.find(({ event }) => event == 'return$toShortStringWithFallback').args;

        expect(await this.mock.$toString(ret0)).to.be.equal(str.length < 32 ? str : '');

        const recovered = await this.mock.$toStringWithFallback(ret0, 0);
        expect(recovered).to.be.equal(str);
      });
    });
  }
});
