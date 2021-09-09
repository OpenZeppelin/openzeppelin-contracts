const { BN, balance, send, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const MultiParty = artifacts.require('MultiParty');

contract('MultiParty', function (accounts) {
  const [ owner, party1, party2, party3 ] = [ accounts[0], accounts[9], accounts[8], accounts[7] ];
  const [ stranger1 ] = [ accounts[1] ];

  let contractInstance;

  beforeEach(async function () {
    contractInstance = await MultiParty.new([party1], { from: owner });
  });

  describe('when the multiparty contract is created', async function () {
    it('should return correct number of members', async () => {
      expect(await contractInstance.totalMembers()).to.be.bignumber.equal('2');
    });

    it('should have owner as a member', async () => {
      expect(await contractInstance.isMember(owner)).to.equal(true);
    });

    it('should have initial member', async () => {
      expect(await contractInstance.isMember(party1)).to.equal(true);
    });

    it('should have 0 actions', async () => {
      expect(await contractInstance.actionCount()).to.be.bignumber.equal('0');
    });

    it('members should be able to create action', async () => {
      const receipt = await createAddMemberAction(party3, owner);
      expectEvent(receipt, 'ActionStateChanged', {
        actionId: new BN(1),
        from: owner,
        state: new BN(1),
      });
      const info = await contractInstance.getActionInfo(1);
      expect(info[2]).to.be.bignumber.equal('1');
    });

    it('non members should NOT be able to create action', async () => {
      await expectRevert(createAddMemberAction(party3, stranger1), 'Only members can create action');
    });

    it('add members cannot be done without an action', async () => {
      await expectRevert(contractInstance.addMember(party3), 'Only this contract can call this method');
    });

    it('remove members cannot be done without an action', async () => {
      await expectRevert(contractInstance.removeMember(party3), 'Only this contract can call this method');
    });

    it('transfer from eth cannot be done without an action', async () => {
      const errorMsg = 'Only this contract can call this method';
      await expectRevert(contractInstance.transfer(party3, web3.utils.toWei('1', 'ether')), errorMsg);
    });
  });

  describe('when an action is created', function () {
    const subAction = {
      method: getEncodedMethod('addMember(address)'),
      params: getEncodedParams([
        { type: 'address', value: party2 },
      ]),
    };

    beforeEach(async function () {
      await createAction([subAction], owner);
    });

    it('should increase action count', async function () {
      expect(await contractInstance.actionCount()).to.be.bignumber.equal('1');
    });

    it('should return correct sub actions', async function () {
      const info = await contractInstance.getActionInfo(1);
      expect(info[0][0]).to.equal(subAction.method);
      expect(info[1][0]).to.equal(subAction.params);
    });

    it('should have correct state', async function () {
      const info = await contractInstance.getActionInfo(1);
      expect(info[2]).to.be.bignumber.equal('1');
    });

    it('should be already approved by creator', async function () {
      expect(await contractInstance.isActionApprovedByUser(1, owner)).to.equal(true);
    });

    it('should not be in approved by all state', async function () {
      expect(await contractInstance.isActionApproved(1)).to.equal(false);
    });

    it('should not be executed before it is approved by all', async function () {
      const errorMsg = 'Only approved actions can be executed';
      await expectRevert(contractInstance.executeAction(1, { from: owner }), errorMsg);
    });

    it('members should be able to approve the action', async function () {
      const receipt = await contractInstance.approveAction(1, true, { from: party1 });
      expectEvent(receipt, 'ActionStateChanged', {
        actionId: new BN(1),
        from: party1,
        state: new BN(2),
      });
      expect(await contractInstance.isActionApprovedByUser(1, party1)).to.equal(true);
    });

    it('non members should NOT be able to approve the action', async function () {
      const errorMsg = 'Only members can approve action';
      await expectRevert(contractInstance.approveAction(1, true, { from: stranger1 }), errorMsg);
    });

    describe('and approved by all members', function () {
      beforeEach(async function () {
        await contractInstance.approveAction(1, true, { from: party1 });
      });

      it('should return correct state', async function () {
        expect(await contractInstance.isActionApproved(1)).to.equal(true);
      });

      it('members should be able execute the action', async function () {
        const receipt = await contractInstance.executeAction(1, { from: owner });
        expectEvent(receipt, 'ActionStateChanged', {
          actionId: new BN(1),
          from: owner,
          state: new BN(3),
        });
      });

      it('non members should NOT be able execute the action', async function () {
        await expectRevert(contractInstance.executeAction(1, { from: stranger1 }), 'Only members can execute action');
      });

      describe('and after execution', function () {
        beforeEach(async function () {
          expect(await contractInstance.isMember(party2)).to.equal(false);
          await contractInstance.executeAction(1, { from: party1 });
        });

        it('should actually perform transaction mentioned in the action', async function () {
          expect(await contractInstance.isMember(party2)).to.equal(true);
        });

        it('should not be able to execute an already executed action', async function () {
          const errorMsg = 'Action already executed';
          await expectRevert(contractInstance.executeAction(1, { from: owner }), errorMsg);
          await expectRevert(contractInstance.executeAction(1, { from: party1 }), errorMsg);
        });
      });
    });
  });

  describe('contract membership', async function () {
    describe('when member is added', function () {
      beforeEach(async function () {
        await createAddMemberAction(party3, owner);
        await contractInstance.approveAction(1, true, { from: party1 });
        expect(await contractInstance.isActionApproved(1)).to.equal(true);
        await addMember(party2, [party1], owner);
      });

      it('should increase the member count', async function () {
        expect(await contractInstance.totalMembers()).to.be.bignumber.equal('3');
      });

      it('should return the membership status of new member', async function () {
        expect(await contractInstance.isMember(party2)).to.equal(true);
      });

      it('previous approved and not executed action status should become invalid', async function () {
        expect(await contractInstance.isActionApproved(1)).to.equal(false);
      });
    });

    describe('removing member', function () {
      beforeEach(async function () {
        await createRemoveMemberAction(party1, owner);
      });

      it('should not succeed if the member being removed has not approved the action', async function () {
        const errorMsg = 'Only approved actions can be executed';
        await expectRevert(contractInstance.executeAction(1, { from: party1 }), errorMsg);
      });

      it('should remove the member if action is approved and executed', async function () {
        await contractInstance.approveAction(1, true, { from: party1 });
        const receipt = await contractInstance.executeAction(1, { from: owner });
        expectEvent(receipt, 'ActionStateChanged', {
          actionId: new BN(1),
          from: owner,
          state: new BN(3),
        });
      });

      it('can be executed by member being removed as well', async function () {
        await contractInstance.approveAction(1, true, { from: party1 });
        const receipt = await contractInstance.executeAction(1, { from: party1 });
        expectEvent(receipt, 'ActionStateChanged', {
          actionId: new BN(1),
          from: party1,
          state: new BN(3),
        });
      });
    });

    describe('when member is removed', function () {
      beforeEach(async function () {
        await createAddMemberAction(party2, owner);
        await createRemoveMemberAction(party1, owner);
        expect(await contractInstance.isActionApproved(1)).to.equal(false);
        await contractInstance.approveAction(2, true, { from: party1 });
        await contractInstance.executeAction(2, { from: owner });
      });

      it('should decrease the member count', async function () {
        expect(await contractInstance.totalMembers()).to.be.bignumber.equal('1');
      });

      it('should return correct membership status of removed member', async function () {
        expect(await contractInstance.isMember(party1)).to.equal(false);
      });

      it('previous invalid action may become approved', async function () {
        expect(await contractInstance.isActionApproved(1)).to.equal(true);
      });
    });
  });

  describe('complex actions', function () {
    beforeEach(async function () {
      await send.ether(owner, contractInstance.address, ether('3'));
    });

    it('should be able to remove a member by giving some incentive', async function () {
      const removeAction = {
        method: getEncodedMethod('removeMember(address)'),
        params: getEncodedParams([
          {
            type: 'address',
            value: party1,
          },
        ]),
      };
      const incentiveAction = getTransferSubAction(party1, '1');

      await createAction([removeAction, incentiveAction], owner);
      await contractInstance.approveAction(1, true, { from: party1 });
      const tracker = await balance.tracker(party1);
      await contractInstance.executeAction(1, { from: owner });
      expect(await contractInstance.totalMembers()).to.be.bignumber.equal('1');
      expect(await contractInstance.isMember(party1)).to.equal(false);
      const incentive = await tracker.delta();
      expect(incentive).to.be.bignumber.equal(ether('1'));
    });

    it('should be able to distribute wealth', async function () {
      const transfer1 = getTransferSubAction(owner, '1');
      const transfer2 = getTransferSubAction(party1, '1');

      await createAction([transfer1, transfer2], owner);
      await contractInstance.approveAction(1, true, { from: party1 });
      const tracker = await balance.tracker(party1);
      const tracker1 = await balance.tracker(owner);
      await contractInstance.executeAction(1, { from: owner });
      expect(await tracker.delta()).to.be.bignumber.equal(ether('1'));
      expect(await tracker1.delta()).to.be.bignumber.greaterThan(ether('0.95'));
    });

    it('should fail the action if one sub action fails', async function () {
      const transfer1 = getTransferSubAction(owner, '3');
      const transfer2 = getTransferSubAction(party1, '1');

      await createAction([transfer1, transfer2], owner);
      await contractInstance.approveAction(1, true, { from: party1 });
      const tracker = await balance.tracker(party1);
      const tracker1 = await balance.tracker(owner);
      const tracker3 = await balance.tracker(contractInstance.address);
      await expectRevert(contractInstance.executeAction(1, { from: owner }), 'All method executions must succeed');
      expect(await tracker.delta()).to.be.bignumber.equal(ether('0'));
      expect(await tracker1.delta()).to.be.bignumber.lessThan(ether('0'));
      expect(await tracker3.delta()).to.be.bignumber.equal(ether('0'));
    });
  });

  async function addMember (memberToAdd, membersToApprove, createdBy = owner) {
    const receipt = await createAddMemberAction(memberToAdd, createdBy);
    const actionId = receipt.logs.filter(e => e.event === 'ActionStateChanged')[0].args.actionId;
    for (let i = 0; i < membersToApprove.length; i++) {
      await contractInstance.approveAction(actionId, true, { from: membersToApprove[i] });
    }
    return await contractInstance.executeAction(actionId, { from: owner });
  }

  function getTransferSubAction (transferTo, valueInEth) {
    return {
      method: getEncodedMethod('transfer(address,uint256)'),
      params: getEncodedParams([
        {
          type: 'address',
          value: transferTo,
        },
        {
          type: 'uint256',
          value: ether(valueInEth),
        },
      ]),
    };
  }

  async function createAddMemberAction (memberToAdd, createdBy = owner) {
    const subAction = {
      method: getEncodedMethod('addMember(address)'),
      params: getEncodedParams([
        {
          type: 'address',
          value: memberToAdd,
        },
      ]),
    };
    return await createAction([subAction], createdBy);
  }

  async function createRemoveMemberAction (memberToRemove, createdBy = owner) {
    const subAction = {
      method: getEncodedMethod('removeMember(address)'),
      params: getEncodedParams([
        {
          type: 'address',
          value: memberToRemove,
        },
      ]),
    };
    return await createAction([subAction], createdBy);
  }

  function getEncodedMethod (methodDefinition) {
    return web3.eth.abi.encodeFunctionSignature(methodDefinition);
  }

  function getEncodedParams (params) {
    const _types = [];
    const _values = [];
    for (let i = 0; i < params.length; i++) {
      _types[i] = params[i].type;
      _values[i] = params[i].value;
    }
    return web3.eth.abi.encodeParameters(_types, _values);
  }

  async function createAction (subActions, createdBy = owner) {
    const _methods = [];
    const _params = [];
    for (let i = 0; i < subActions.length; i++) {
      _methods[i] = subActions[i].method;
      _params[i] = subActions[i].params;
    }
    return await contractInstance.createAction(_methods, _params, { from: createdBy });
  }
});
