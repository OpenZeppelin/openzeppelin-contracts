pragma solidity ^0.4.8;


import './ERC20Basic.sol';
import '../SafeMath.sol';


/*
 * Basic token
 * Basic version of StandardToken, with no allowances
 */
contract BasicToken is ERC20Basic, SafeMath {

  mapping(address => uint) balances;

/*
 * Fix for the ERC20 short address attack  
 */
  modifier onlyPayloadSize(uint size) {
     assert(msg.data.length == size + 4);
     _;
  }

  function transfer(address _to, uint _value) onlyPayloadSize(2 * 32) {
    balances[msg.sender] = safeSub(balances[msg.sender], _value);
    balances[_to] = safeAdd(balances[_to], _value);
    Transfer(msg.sender, _to, _value);
  }

  function balanceOf(address _owner) constant returns (uint balance) {
    return balances[_owner];
  }
  
}
