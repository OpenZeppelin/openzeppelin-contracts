const { balance, ether, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const MultiPartyFundable = artifacts.require('MultiPartyFundable');
const MultiPartyEscrow = artifacts.require('MultiPartyEscrow');

contract('MultiPartyFundable', function (accounts) {
  const [ owner, party1, party2 ] = [ accounts[0], accounts[9], accounts[8]];

  let contractInstance;
  let escrowAddress;

  beforeEach(async function () {
    contractInstance = await MultiPartyFundable.new([party1, party2], { from: owner });
    escrowAddress = await contractInstance.escrow();
  });

  describe('when the multiparty fundable contract is created', async function () {
    it('should have non empty escrowAddress contract', async () => {
      expect(escrowAddress.length).to.be.greaterThan(0);
    });

    it('should have escrowAddress contract with correct owner', async () => {
      const escrowInstance = await MultiPartyEscrow.at(escrowAddress);
      expect(await escrowInstance.owner()).to.be.equal(contractInstance.address);
    });

    it('members should be able to fund the contract', async () => {
      const escrowInstance = await MultiPartyEscrow.at(escrowAddress);
      await escrowInstance.deposit({ from: owner, value: ether('1') });
      await escrowInstance.deposit({ from: party1, value: ether('1') });
      await escrowInstance.deposit({ from: party2, value: ether('1') });
      const trackerContract = await balance.tracker(contractInstance.address);
      const withdraw1 = getWithdrawSubAction(owner, '1');
      const withdraw2 = getWithdrawSubAction(party1, '1');
      const withdraw3 = getWithdrawSubAction(party2, '1');
      await createAction([withdraw1, withdraw2, withdraw3], owner);
      await contractInstance.approveAction(1, true, { from: party1 });
      await contractInstance.approveAction(1, true, { from: party2 });
      await contractInstance.executeAction(1, { from: owner });
      expect(await trackerContract.delta()).to.be.bignumber.equal(ether('3'));
    });

    it('should not be able to call withdraw without an approved action', async () => {
      await expectRevert(contractInstance.withdraw(party1, ether('1')), 'Only this contract can call this method');
    });
  });

  function getWithdrawSubAction (from, valueInEth) {
    return {
      method: getEncodedMethod('withdraw(address,uint256)'),
      params: getEncodedParams([
        {
          type: 'address',
          value: from,
        },
        {
          type: 'uint256',
          value: ether(valueInEth),
        },
      ]),
    };
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
