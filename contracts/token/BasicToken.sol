pragma solidity ^0.4.8;


import './ERC20Basic.sol';
import '../SafeMath.sol';


/**
 * @title Basic token
 * @dev Basic version of StandardToken, with no allowances
 */
contract BasicToken is ERC20Basic {
  using SafeMath for uint;

  mapping(address => uint) balances;

  /**
   * @dev Fix for the ERC20 short address attack
   */
  modifier onlyPayloadSize(uint size) {
     if(msg.data.length < size + 4) {
       throw;
     }
     _;
  }

  /**
  * @dev transfer token for a specified address
  * @param _to address The address which you want to transfer to
  * @param _value uint the amout to be transfered
  */
  function transfer(address _to, uint _value) onlyPayloadSize(2 * 32) {
    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    Transfer(msg.sender, _to, _value);
  }

  /**
  * @dev Function to get the balance of the specified address
  * @param _owner address The address you wish to get the balance from
  * @return An uint representing the amout owned by the passed address
  */
  function balanceOf(address _owner) constant returns (uint balance) {
    return balances[_owner];
  }

}
