const { ether, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const MultiPartyWithERC20 = artifacts.require('MultiPartyWithERC20');
const ERC20Mock = artifacts.require('ERC20Mock');

contract('MultiPartyWithERC20', function (accounts) {
  const [ owner, party1, party2, erc20Owner ] = [ accounts[0], accounts[9], accounts[8], accounts[1]];
  const [ stranger, anotherStranger ] = [ accounts[7], accounts[6] ];

  let contractInstance;
  let erc20Instance;

  beforeEach(async function () {
    contractInstance = await MultiPartyWithERC20.new([party1, party2], { from: owner });
    erc20Instance = await ERC20Mock.new('TestERC20', 'TEST20', owner, ether('10'), { from: erc20Owner });
    await erc20Instance.mint(party1, ether('10'), { from: erc20Owner });
    await erc20Instance.mint(party2, ether('10'), { from: erc20Owner });
    expect(await erc20Instance.balanceOf(owner)).to.be.bignumber.equal(ether('10'));
    expect(await erc20Instance.balanceOf(party1)).to.be.bignumber.equal(ether('10'));
    expect(await erc20Instance.balanceOf(party2)).to.be.bignumber.equal(ether('10'));
    await erc20Instance.approve(contractInstance.address, ether('5'), { from: owner });
    await erc20Instance.approve(contractInstance.address, ether('5'), { from: party1 });
    await erc20Instance.approve(contractInstance.address, ether('5'), { from: party2 });
  });

  describe('when the multiparty contract with erc20 is created', async function () {
    it('should be able to transfer erc20 tokens to contract with single action', async () => {
      await executeActionToTransferERC20();
      expect(await erc20Instance.balanceOf(owner)).to.be.bignumber.equal(ether('8'));
      expect(await erc20Instance.balanceOf(party1)).to.be.bignumber.equal(ether('8'));
      expect(await erc20Instance.balanceOf(party2)).to.be.bignumber.equal(ether('8'));
      expect(await erc20Instance.balanceOf(contractInstance.address)).to.be.bignumber.equal(ether('6'));
    });

    it('should be able to approve another account using an action', async () => {
      await executeActionToTransferERC20();
      const approve = getApproveSubAction(erc20Instance.address, stranger, '3');
      await createAction([approve], owner);
      await contractInstance.approveAction(2, true, { from: party1 });
      await contractInstance.approveAction(2, true, { from: party2 });
      await contractInstance.executeAction(2, { from: owner });

      await erc20Instance.transferFrom(contractInstance.address, anotherStranger, ether('2'), { from: stranger });
      expect(await erc20Instance.balanceOf(anotherStranger)).to.be.bignumber.equal(ether('2'));
      expect(await erc20Instance.balanceOf(contractInstance.address)).to.be.bignumber.equal(ether('4'));
    });

    it('should not be able to call transferERC20 without an approved action', async () => {
      const errorMsg = 'Only this contract can call this method';
      const erc20Address = erc20Instance.address;
      const multiPartyAddress = contractInstance.address;
      await expectRevert(contractInstance.transferERC20(erc20Address, party1, multiPartyAddress, ether('2')), errorMsg);
    });

    it('should not be able to call approve without an approved action', async () => {
      const errorMsg = 'Only this contract can call this method';
      const erc20Address = erc20Instance.address;
      await expectRevert(contractInstance.approveERC20(erc20Address, stranger, ether('2')), errorMsg);
    });
  });

  async function executeActionToTransferERC20 () {
    const withdraw1 = getTransferERC20SubAction(erc20Instance.address, owner, contractInstance.address, '2');
    const withdraw2 = getTransferERC20SubAction(erc20Instance.address, party1, contractInstance.address, '2');
    const withdraw3 = getTransferERC20SubAction(erc20Instance.address, party2, contractInstance.address, '2');
    await createAction([withdraw1, withdraw2, withdraw3], owner);
    await contractInstance.approveAction(1, true, { from: party1 });
    await contractInstance.approveAction(1, true, { from: party2 });
    await contractInstance.executeAction(1, { from: owner });
  }

  function getTransferERC20SubAction (erc20Contract, from, thirdPartyContract, valueInEth) {
    return {
      method: getEncodedMethod('transferERC20(address,address,address,uint256)'),
      params: getEncodedParams([
        {
          type: 'address',
          value: erc20Contract,
        },
        {
          type: 'address',
          value: from,
        },
        {
          type: 'address',
          value: thirdPartyContract,
        },
        {
          type: 'uint256',
          value: ether(valueInEth),
        },
      ]),
    };
  }

  function getApproveSubAction (erc20Contract, spender, valueInEth) {
    return {
      method: getEncodedMethod('approveERC20(address,address,uint256)'),
      params: getEncodedParams([
        {
          type: 'address',
          value: erc20Contract,
        },
        {
          type: 'address',
          value: spender,
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
