const { EVMRevert } = require('../helpers/EVMRevert');
const { expectThrow } = require('../helpers/expectThrow');

require('chai')
  .should();

const OracleBasic = artifacts.require('OracleBasic');

contract('OracleBasic', function ([owner, oracle, other]) {
  const id = 'unique question';
  const result = 'just some answer';

  beforeEach(async function () {
    this.contract = await OracleBasic.new(oracle, { from: owner });
  });

  it('MUST store the result', async function () {
    const resultExits = await this.contract.resultExist(id);
    resultExits.should.be.equal(false);

    await this.contract.receiveResult(id, result, { from: oracle });

    const resultExitsAfterUpdate = await this.contract.resultExist(id);
    resultExitsAfterUpdate.should.be.equal(true);

    const receivedResult = await this.contract.resultFor(id);
    web3.toUtf8(receivedResult).should.be.equal(result);
  });

  it('MUST revert if the caller is not an oracle authorized to provide the result for that id', async function () {
    await expectThrow(this.contract.receiveResult(id, result, { from: other }), EVMRevert);
  });

  it('MUST return the same result for an id after that result is available', async function () {
    await this.contract.receiveResult(id, result, { from: oracle });
    const receivedResult = await this.contract.resultFor(id);
    web3.toUtf8(receivedResult).should.be.equal(result);

    const receivedResultAgain = await this.contract.resultFor(id);
    web3.toUtf8(receivedResultAgain).should.be.equal(result);
  });

  it('MUST revert if receiveResult has been called with the same id before', async function () {
    await this.contract.receiveResult(id, result, { from: oracle });
    await expectThrow(this.contract.receiveResult(id, result, { from: oracle }), EVMRevert);
  });

  it('MUST revert if the result for an id is not available yet', async function () {
    const nonExistingId = 'non existing id';
    await expectThrow(this.contract.resultFor(nonExistingId), EVMRevert);
  });
});
