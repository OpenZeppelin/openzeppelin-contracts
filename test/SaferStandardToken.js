'use strict';
import expectThrow from './helpers/expectThrow';
import toPromise from './helpers/toPromise';
const SaferStandardTokenMock = artifacts.require('./helpers/SaferStandardTokenMock.sol');
const ERC23TokenMock = artifacts.require('./helpers/ERC23TokenMock.sol');
const Ownable = artifacts.require('../contracts/ownership/Ownable.sol');


contract('SaferStandardToken', function(accounts) {
  let token = null;
  let erc23 = null;

  beforeEach(async function() {
    token = await SaferStandardTokenMock.new(accounts[0], 100);
    erc23 = await ERC23TokenMock.new(accounts[0], 100);
  });

  it('should not accept ERC23 tokens', async function() {
    await expectThrow(erc23.transferERC23(token.address, 10, ''));
  });
  
  it('should not accept own tokens', async function() {
    await expectThrow(token.transfer(token.address, 10));
  });

  it('should allow owner to reclaim tokens', async function() {
    const ownerStartBalance = await token.balanceOf(accounts[0]);
    await erc23.transfer(token.address, 10);
    await token.reclaimToken(token.address);
    const ownerFinalBalance = await token.balanceOf(accounts[0]);
    const finalBalance = await token.balanceOf(token.address);
    
    assert.equal(finalBalance, 0);
    assert.equal(ownerFinalBalance - ownerStartBalance, 0);
  });

  it('should not accept ether', async function() {
    const amount = web3.toWei('1', 'ether');
    await expectThrow(
      toPromise(web3.eth.sendTransaction)({
        from: accounts[1],
        to: token.address,
        value: amount,
      }),
    );
  });

  it('should transfer back ownership of contract', async function() {
    const ownable = await Ownable.new();
    
    await ownable.transferOwnership(token.address);
    let owner = await ownable.owner();
    assert.equal(owner, token.address);

    await token.reclaimContract(ownable.address);
    owner = await ownable.owner();
    assert.equal(owner, accounts[0]);
  });
});

