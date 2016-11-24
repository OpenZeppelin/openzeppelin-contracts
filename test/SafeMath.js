
contract('SafeMath', function(accounts) {

  var safeMath;

  before(function() {
    return SafeMathMock.new()
      .then(function(_safeMath) {
        safeMath = _safeMath;
      });
  });

  it("multiplies correctly", function(done) {
    var a = 5678;
    var b = 1234;
    return safeMath.multiply(a, b)
      .then(function() {
        return safeMath.result();
      })
      .then(function(result) {
        assert.equal(result, a*b);
      })
      .then(done);
  });

  it("adds correctly", function(done) {
    var a = 5678;
    var b = 1234;
    return safeMath.add(a, b)
      .then(function() {
        return safeMath.result();
      })
      .then(function(result) {
        assert.equal(result, a+b);
      })
      .then(done);
  });

  it("subtracts correctly", function(done) {
    var a = 5678;
    var b = 1234;
    return safeMath.subtract(a, b)
      .then(function() {
        return safeMath.result();
      })
      .then(function(result) {
        assert.equal(result, a-b);
      })
      .then(done);
  });

  it("should throw an error if subtraction result would be negative", function (done) {
    var a = 1234;
    var b = 5678;
    return safeMath.subtract(a, b)
      .catch(function(error) {
        if (error.message.search('invalid JUMP') == -1) throw error
      })
      .then(done);
  });

  it("should throw an error on addition overflow", function(done) {
    var a = 115792089237316195423570985008687907853269984665640564039457584007913129639935;
    var b = 1;
    return safeMath.add(a, b)
      .catch(function(error) {
        if (error.message.search('invalid JUMP') == -1) throw error
      })
      .then(done);
  });

  it("should throw an error on multiplication overflow", function(done) {
    var a = 115792089237316195423570985008687907853269984665640564039457584007913129639933;
    var b = 2;
    return safeMath.multiply(a, b)
      .catch(function(error) {
        if (error.message.search('invalid JUMP') == -1) throw error
      })
      .then(done);
  });

});
