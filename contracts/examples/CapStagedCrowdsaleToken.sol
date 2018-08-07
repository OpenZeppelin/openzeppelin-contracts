pragma solidity ^ 0.4.24;

import "../token/ERC20/StandardToken.sol";
import "../ownership/Ownable.sol";


contract CapStagedCrowdsaleToken is StandardToken, Ownable {
  string public constant name = "CapStagedCrowdsaleToken";
  string public constant symbol = "CSC";
  uint8 public constant decimals = 18;
  uint256 public constant INITIAL_SUPPLY = 1000000 * (10 ** uint256(decimals));

  /**
    * @dev Constructor that gives msg.sender all of existing tokens.
    */
  constructor() public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    emit Transfer(address(0), msg.sender, INITIAL_SUPPLY);
    owner = msg.sender;
  }
}
