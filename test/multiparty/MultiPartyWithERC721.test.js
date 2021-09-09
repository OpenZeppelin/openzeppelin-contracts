const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const MultiPartyWithERC721 = artifacts.require('MultiPartyWithERC721');
const ERC721Mock = artifacts.require('ERC721Mock');

contract('MultiPartyWithERC721', function (accounts) {
  const [ owner, party1, party2, erc721Owner ] = [ accounts[0], accounts[9], accounts[8], accounts[1]];
  const [ stranger, anotherStranger ] = [ accounts[7], accounts[6] ];

  let contractInstance;
  let erc721Instance;

  beforeEach(async function () {
    contractInstance = await MultiPartyWithERC721.new([party1, party2], { from: owner });
    erc721Instance = await ERC721Mock.new('TestERC721', 'TEST721', { from: erc721Owner });
    await erc721Instance.mint(owner, 1, { from: erc721Owner });
    await erc721Instance.mint(party1, 2, { from: erc721Owner });
    await erc721Instance.mint(party2, 3, { from: erc721Owner });
    expect(await erc721Instance.ownerOf(1)).to.be.equal(owner);
    expect(await erc721Instance.ownerOf(2)).to.be.equal(party1);
    expect(await erc721Instance.ownerOf(3)).to.be.equal(party2);
    await erc721Instance.setApprovalForAll(contractInstance.address, true, { from: owner });
    await erc721Instance.setApprovalForAll(contractInstance.address, true, { from: party1 });
    await erc721Instance.setApprovalForAll(contractInstance.address, true, { from: party2 });
  });

  describe('when the multiparty contract with erc721 is created', async function () {
    it('should be able to transfer erc721 tokens to contract with single action', async () => {
      await executeActionToTransferERC721();
      expect(await erc721Instance.ownerOf(1)).to.be.equal(contractInstance.address);
      expect(await erc721Instance.ownerOf(2)).to.be.equal(contractInstance.address);
      expect(await erc721Instance.ownerOf(3)).to.be.equal(contractInstance.address);
    });

    it('should be able to approve another account using an action', async () => {
      await executeActionToTransferERC721();
      const approve = getApproveSubAction(erc721Instance.address, stranger);
      await createAction([approve], owner);
      await contractInstance.approveAction(2, true, { from: party1 });
      await contractInstance.approveAction(2, true, { from: party2 });
      await contractInstance.executeAction(2, { from: owner });

      await erc721Instance.transferFrom(contractInstance.address, anotherStranger, 2, { from: stranger });
      expect(await erc721Instance.ownerOf(2)).to.be.equal(anotherStranger);
    });

    it('should not be able to call transferERC721 without an approved action', async () => {
      const errorMsg = 'Only this contract can call this method';
      const erc721Address = erc721Instance.address;
      const multiPartyAddress = contractInstance.address;
      await expectRevert(contractInstance.transferERC721(erc721Address, party1, multiPartyAddress, 2), errorMsg);
    });

    it('should not be able to call approve without an approved action', async () => {
      const errorMsg = 'Only this contract can call this method';
      const erc721Address = erc721Instance.address;
      await expectRevert(contractInstance.approveERC721(erc721Address, stranger, 2), errorMsg);
    });
  });

  async function executeActionToTransferERC721 () {
    const withdraw1 = getTransferERC721SubAction(erc721Instance.address, owner, contractInstance.address, 1);
    const withdraw2 = getTransferERC721SubAction(erc721Instance.address, party1, contractInstance.address, 2);
    const withdraw3 = getTransferERC721SubAction(erc721Instance.address, party2, contractInstance.address, 3);
    await createAction([withdraw1, withdraw2, withdraw3], owner);
    await contractInstance.approveAction(1, true, { from: party1 });
    await contractInstance.approveAction(1, true, { from: party2 });
    await contractInstance.executeAction(1, { from: owner });
  }

  function getTransferERC721SubAction (erc721Contract, from, thirdPartyContract, tokenId) {
    return {
      method: getEncodedMethod('transferERC721(address,address,address,uint256)'),
      params: getEncodedParams([
        {
          type: 'address',
          value: erc721Contract,
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
          value: tokenId,
        },
      ]),
    };
  }

  function getApproveSubAction (erc721Contract, spender) {
    return {
      method: getEncodedMethod('setApprovalForAllERC721(address,address,bool)'),
      params: getEncodedParams([
        {
          type: 'address',
          value: erc721Contract,
        },
        {
          type: 'address',
          value: spender,
        },
        {
          type: 'bool',
          value: true,
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
