pragma solidity ^0.4.11;


import './ERC20Basic.sol';

/**
 * @title TokenTimelock
 * @dev TokenTimelock is a token holder contract that will allow a 
 * beneficiary to extract the tokens after a given release time
 */
contract TokenTimelock {
  
  // ERC20 basic token contract being held
  ERC20Basic token;

  // beneficiary of tokens after they are released
  address beneficiary;

  // timestamp when token release is enabled
  uint releaseTime;

  function TokenTimelock(ERC20Basic _token, address _beneficiary, uint _releaseTime) {
    require(_releaseTime > now);
    token = _token;
    beneficiary = _beneficiary;
    releaseTime = _releaseTime;
  }

  /**
   * @dev beneficiary claims tokens held by time lock
   */
  function claim() {
    require(msg.sender == beneficiary);
    require(now >= releaseTime);

    uint amount = token.balanceOf(this);
    require(amount > 0);

    token.transfer(beneficiary, amount);
  }
}
