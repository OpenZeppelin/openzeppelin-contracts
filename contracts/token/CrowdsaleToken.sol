pragma solidity ^0.4.8;


import "./StandardToken.sol";


/*
 * CrowdsaleToken
 *
 * Simple ERC20 Token example, with crowdsale token creation
 * IMPORTANT NOTE: do not use or deploy this contract as-is.
 * It needs some changes to be production ready.
 */
contract CrowdsaleToken is StandardToken {

  string public constant name = "CrowdsaleToken";
  string public constant symbol = "CRW";
  uint public constant decimals = 18;
  // replace with your fund collection multisig address 
  address public constant multisig = 0x0; 


  // 1 ether = 500 example tokens 
  uint public constant PRICE = 500;

  function () payable {
    createTokens(msg.sender);
  }
  
  function createTokens(address recipient) payable {
    if (msg.value == 0) {
      throw;
    }

    uint tokens = msg.value.safeMul(getPrice());
    totalSupply = totalSupply.safeAdd(tokens);

    balances[recipient] = balances[recipient].safeAdd(tokens);

    if (!multisig.send(msg.value)) {
      throw;
    }
  }
  
  // replace this with any other price function
  function getPrice() constant returns (uint result) {
    return PRICE;
  }
}
