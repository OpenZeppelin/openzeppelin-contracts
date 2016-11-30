
contract('SafeMath', function(accounts) {

  let safeMath;

  before(async function(done) {
    safeMath = await SafeMathMock.new();
    done();
  });

  it("multiplies correctly", async function(done) {
    let a = 5678;
    let b = 1234;
    let mult = await safeMath.multiply(a, b);
    let result = await safeMath.result();
    assert.equal(result, a*b);
    done();
  });

  it("adds correctly", async function(done) {
    let a = 5678;
    let b = 1234;
    let add = await safeMath.add(a, b);
    let result = await safeMath.result();
    assert.equal(result, a+b);
    done();
  });

  it("subtracts correctly", async function(done) {
    let a = 5678;
    let b = 1234;
    let subtract = await safeMath.subtract(a, b);
    let result = await safeMath.result();
    assert.equal(result, a-b);
    done();
  });

  it("should throw an error if subtraction result would be negative", async function (done) {
    let a = 1234;
    let b = 5678;
    try {
      let subtract = await safeMath.subtract(a, b);
    } catch(error) {
      if (error.message.search('invalid JUMP') == -1) throw error
      assert.isAbove(error.message.search('invalid JUMP'), -1, 'Invalid JUMP error must be returned');
      done();
    }
  });

  it("should throw an error on addition overflow", async function(done) {
    let a = 115792089237316195423570985008687907853269984665640564039457584007913129639935;
    let b = 1;
    try {
      let add = await safeMath.add(a, b);
    } catch(error) {
      if (error.message.search('invalid JUMP') == -1) throw error
      assert.isAbove(error.message.search('invalid JUMP'), -1, 'Invalid JUMP error must be returned');
      done();
    }
  });

  it("should throw an error on multiplication overflow", async function(done) {
    let a = 115792089237316195423570985008687907853269984665640564039457584007913129639933;
    let b = 2;
    try {
      let multiply = await safeMath.multiply(a, b);
    } catch(error) {
      if (error.message.search('invalid JUMP') == -1) throw error
      assert.isAbove(error.message.search('invalid JUMP'), -1, 'Invalid JUMP error must be returned');
      done();
    }
  });

});
