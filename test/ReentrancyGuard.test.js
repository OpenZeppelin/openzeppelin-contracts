const { expectThrow } = require('./helpers/expectThrow');
const ReentrancyMock = artifacts.require('ReentrancyMock');
const ReentrancyAttack = artifacts.require('ReentrancyAttack');

contract('ReentrancyGuard', function (accounts) {
  let reentrancyMock;

  beforeEach(async function () {
    reentrancyMock = await ReentrancyMock.new();
    const initialCounter = await reentrancyMock.counter();
    assert.equal(initialCounter, 0);
  });

  it('should not allow remote callback', async function () {
    const attacker = await ReentrancyAttack.new();
    await expectThrow(reentrancyMock.countAndCall(attacker.address));
  });

  // The following are more side-effects than intended behaviour:
  // I put them here as documentation, and to monitor any changes
  // in the side-effects.

  it('should not allow local recursion', async function () {
    await expectThrow(reentrancyMock.countLocalRecursive(10));
  });

  it('should not allow indirect local recursion', async function () {
    await expectThrow(reentrancyMock.countThisRecursive(10));
  });
});
