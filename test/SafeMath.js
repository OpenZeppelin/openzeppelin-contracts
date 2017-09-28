const assertJump = require('./helpers/assertJump');
var SafeMathMock = artifacts.require("./helpers/SafeMathMock.sol");

contract('SafeMath', function(accounts) {

  let safeMath;

  before(async function() {
    safeMath = await SafeMathMock.new();
  });

  it("multiplies correctly", async function() {
    let randomSign = Math.random() < 0.5 ? -1 : 1;

    let a = Math.floor(Math.random() * 100) * randomSign;
    let b = Math.floor(Math.random() * 100) * randomSign;
    
    let mult = await safeMath.multiply(a, b);
    let result = await safeMath.result();
    assert.equal(result, a*b);
  });

  it("adds correctly", async function() {
    let randomSign = Math.random() < 0.5 ? -1 : 1;

    let a = Math.floor(Math.random() * 100) * randomSign;
    let b = Math.floor(Math.random() * 100) * randomSign;
    
    let add = await safeMath.add(a, b);
    let result = await safeMath.result();

    assert.equal(result, a+b);
  });

  it("subtracts correctly", async function() {
    let randomSign = Math.random() < 0.5 ? -1 : 1;

    let a = Math.floor(Math.random() * 100) * randomSign;
    let b = Math.floor(Math.random() * 100) * randomSign;
    
    let subtract = await safeMath.subtract(a, b);
    let result = await safeMath.result();

    assert.equal(result, a-b);
  });

  it("should throw an error if subtraction result would be negative", async function () {
    let randomSign = Math.random() < 0.5 ? -1 : 1;

    let a = Math.floor(Math.random() * 100) * randomSign;
    let b = Math.floor(Math.random() * 100) * randomSign;
    
    try {
      let subtract = await safeMath.subtract(a, b);
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error);
    }
  });

  it("should throw an error on addition overflow", async function() {
    let randomSign = Math.random() < 0.5 ? -1 : 1;

    let a = Math.floor(Math.random() ** 10000000000000000000000000) * randomSign;
    let b = Math.floor(Math.random() * 100) * randomSign;
    try {
      let add = await safeMath.add(a, b);
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error);
    }
  });

  it("should throw an error on multiplication overflow", async function() {
    let randomSign = Math.random() < 0.5 ? -1 : 1;

    let a = Math.floor(Math.random() ** 10000000000000000000000000) * randomSign;
    let b = Math.floor(Math.random() * 100) * randomSign;
    
    try {
      let multiply = await safeMath.multiply(a, b);
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error);
    }
  });

});
