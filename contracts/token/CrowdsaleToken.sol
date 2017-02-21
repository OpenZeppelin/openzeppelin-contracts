pragma solidity ^0.4.8;


import "./StandardToken.sol";


/*
 * CrowdsaleToken
 *
 * Simple ERC20 Token example, with crowdsale token creation
 */
contract CrowdsaleToken is StandardToken {

  string public name = "CrowdsaleToken";
  string public symbol = "CRW";
  uint public decimals = 18;

  // 1 ether = 500 example tokens 
  uint PRICE = 500;

  function () payable {
    createTokens(msg.sender);
  }
  
  function createTokens(address recipient) payable {
    if (msg.value == 0) {
      throw;
    }

    uint tokens = safeMul(msg.value, getPrice());

    totalSupply = safeAdd(totalSupply, tokens);
    balances[recipient] = safeAdd(balances[recipient], tokens);
  }
  
  // replace this with any other price function
  function getPrice() constant returns (uint result) {
    return PRICE;
  }
}
