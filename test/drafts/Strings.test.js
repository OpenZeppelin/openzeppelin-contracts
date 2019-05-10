const Strings = artifacts.require('Strings')

contract('Strings', function([owner, anotherAccount]) {
  let strings;
  let a = "AZ@#://12345";
  let b = "$#%#!";
  let c = "";
  let ab = a + b;
  let ac = a + c;
  let ca = c + a;
  let zero = "0";
  let one = "1";
  let onetrillion = "1000000000000"

  beforeEach(async function() {
    strings = await Strings.new({ from: owner })
  });

  describe('String functions', function() {
    it('concatenates', async function() {
      const _ab = await strings.Concatenate(a, b);
      assert.equal(ab, _ab);
      const _ac = await strings.Concatenate(a, c);
      assert.equal(ac, _ac);
      const _ca = await strings.Concatenate(c, a);
      assert.equal(ca, _ca);
    })

    it('converts to a string', async function() {
      const _zero = await strings.UintToString(0);
      assert.equal(zero, _zero);
      const _one = await strings.UintToString(1);
      assert.equal(one, _one);
      const _onetrillion = await strings.UintToString(1000000000000);
      assert.equal(onetrillion, _onetrillion);
    })
  });
});