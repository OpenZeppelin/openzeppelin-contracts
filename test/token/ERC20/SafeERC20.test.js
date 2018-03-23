import EVMRevert from '../../helpers/EVMRevert';

require('chai')
  .use(require('chai-as-promised'))
  .should();

const SafeERC20Helper = artifacts.require('SafeERC20Helper');

contract('SafeERC20', function () {
  beforeEach(async function () {
    this.helper = await SafeERC20Helper.new();
  });

  it('should throw on failed transfer', async function () {
    await this.helper.doFailingTransfer().should.be.rejectedWith(EVMRevert);
  });

  it('should throw on failed transferFrom', async function () {
    await this.helper.doFailingTransferFrom().should.be.rejectedWith(EVMRevert);
  });

  it('should throw on failed approve', async function () {
    await this.helper.doFailingApprove().should.be.rejectedWith(EVMRevert);
  });

  it('should not throw on succeeding transfer', async function () {
    await this.helper.doSucceedingTransfer().should.be.fulfilled;
  });

  it('should not throw on succeeding transferFrom', async function () {
    await this.helper.doSucceedingTransferFrom().should.be.fulfilled;
  });

  it('should not throw on succeeding approve', async function () {
    await this.helper.doSucceedingApprove().should.be.fulfilled;
  });
});
