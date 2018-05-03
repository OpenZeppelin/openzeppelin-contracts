
pragma solidity ^0.4.21;

import "./StandardToken.sol";

/**
 * @title Nexty Foundation Token
 */
contract NTFToken is StandardToken {
  string public constant symbol = "NTF";
  string public constant name = "Nexty Foundation Token";
  uint8 public constant decimals = 18;
  uint256 public constant INITIAL_SUPPLY = 10000000 * (10 ** uint256(decimals));
  
  /**
   * Check if address is a valid destination to transfer tokens to
   * - must not be zero address
   * - must not be the token address
   * - must not be the owner's address
   */
  modifier validDestination(address to) {
    require(to != address(0x0));
    require(to != address(this));
    require(to != owner);
    _;
  }
    
  /**
   * Token contract constructor
   */
  constructor() public {
    totalSupply_ = INITIAL_SUPPLY;
        
    // Mint tokens
    balances[msg.sender] = totalSupply_;
    Transfer(address(0x0), msg.sender, totalSupply_);
  }

  /**
   * Transfer from sender to another account
   *
   * @param _to Destination address
   * @param _value Amount of NTF token to send
   */
  function transfer(address _to, uint256 _value) public validDestination(to) returns (bool) {
    return super.transfer(_to, _value);
  }
  
  /**
   * Transfer from `from` account to `to` account using allowance in `from` account to the sender
   *
   * @param _from Origin address
   * @param _to Destination address
   * @param _value Amount of NTF token to send
   */
  function transferFrom(address _from, address _to, uint256 _value) public validDestination(to) returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }
}