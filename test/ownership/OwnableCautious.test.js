const { constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const OwnableCautiousMock = artifacts.require('OwnableCautiousMock');

contract('OwnableCautiousMock', function ([_, owner, newOwner, other]) {

    beforeEach(async function () {
        this.OwnableCautious = await OwnableCautiousMock.new({ from: owner });
    });

    it('should report the correct initial owner', async function () {
        expect(await this.OwnableCautious.owner()).to.equal(owner);
    });

    describe('onlyOwner', function () {
        it('allows the owner to call onlyOwner functions', async function () {
            await this.OwnableCautious.onlyOwnerMock({ from: owner });
        });

        it('reverts when non-owner calls onlyOwner functions', async function () {
            await expectRevert(this.OwnableCautious.onlyOwnerMock({ from: other }),
            'OwnableCautious: Caller must be the owner'
            );
        });

    });

    describe('ownership transfers', function () {

        it('changes owner after authorize and accept', async function () {
            expect(await this.OwnableCautious.isOwner({ from: newOwner })).to.equal(false);
            const authorize = await this.OwnableCautious.authorizeTransferOwnership(newOwner, { from: owner });
            expectEvent.inLogs(authorize.logs, 'AuthorizedOwnershipTransfer');
      
            expect(await this.OwnableCautious.newOwner()).to.equal(newOwner);

            const transfer = await this.OwnableCautious.transferOwnership({ from: newOwner });
            expectEvent.inLogs(transfer.logs, 'OwnershipTransferred');

            expect(await this.OwnableCautious.isOwner({ from: newOwner })).to.equal(true);
          });

        it('should prevent non-owners from authorizing owner transfer', async function () {
            await expectRevert(
                this.OwnableCautious.authorizeTransferOwnership(newOwner, { from: other }),
                'OwnableCautious: Caller must be the owner'
              );
          });

          it('should prevent non-owners from completing owner transfer', async function () {
            await expectRevert(
                this.OwnableCautious.transferOwnership({ from: other }),
                'OwnableCautious: only the previously specified new owner may accept ownership transfer'
              );
          });

          it('should prevent owner from renouncing ownership without confirm bool set true', async function () {
            await expectRevert(
                this.OwnableCautious.renounceOwnership(false, { from: owner }),
                'OwnableCautious: To confirm renunciation `confirm` must be true'
              );
          });

          it('should prevent non-owners from renouncing ownership', async function () {
            await expectRevert(
                this.OwnableCautious.renounceOwnership(true, { from: other }),
                'OwnableCautious: Caller must be the owner'
              );
          });

          it('loses owner and possibility for new owner after renouncement', async function () {
            const renounce = await this.OwnableCautious.renounceOwnership(true, { from: owner });
            expectEvent.inLogs(renounce.logs, 'OwnershipTransferred');
      
            expect(await this.OwnableCautious.owner()).to.equal(ZERO_ADDRESS);
            expect(await this.OwnableCautious.newOwner()).to.equal(ZERO_ADDRESS);
          });
    
    });

});