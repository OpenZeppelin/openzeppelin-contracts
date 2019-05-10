const Strings = artifacts.require('Strings');

contract('Strings', function ([owner, anotherAccount]) {
  let strings;
  const a = 'AZ@#://12345';
  const b = '$#%#!';
  const c = '';
  const ab = a + b;
  const ac = a + c;
  const ca = c + a;
  const zero = '0';
  const one = '1';
  const onetrillion = '1000000000000';

  beforeEach(async function () {
    strings = await Strings.new({ from: owner });
  });

  describe('String functions', function () {
    it('concatenates', async function () {
      const _ab = await strings.concatenate(a, b);
      assert.equal(ab, _ab);
      const _ac = await strings.concatenate(a, c);
      assert.equal(ac, _ac);
      const _ca = await strings.concatenate(c, a);
      assert.equal(ca, _ca);
    });

    it('converts to a string', async function () {
      const _zero = await strings.uintToString(0);
      assert.equal(zero, _zero);
      const _one = await strings.uintToString(1);
      assert.equal(one, _one);
      const _onetrillion = await strings.uintToString(1000000000000);
      assert.equal(onetrillion, _onetrillion);
    });
  });
});
