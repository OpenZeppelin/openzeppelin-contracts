pragma solidity ^0.4.18;

import "../token/ERC20/MintableToken.sol";
import "../token/ERC20/TokenTimelock.sol";



/**
 * @title SampleTokenTimelockToken
 * @dev Very simple ERC20 Token that can be minted.
 * It is meant to be used in a token time lock contract.
 */

contract SampleTokenTimelockToken is MintableToken {


  string public constant name = "Sample TokenTimelock Token";
  string public constant symbol = "STT"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase


}





/**
 * @title SampleTokenTimelock
 *
 * @dev This is an example of a token time lock, which allows a beneficiary to recieve funds after a specified date
 *
 */

contract SampleTokenTimelock is TokenTimelock {
  function SampleTokenTimelock(MintableToken _token, address beneficiary, uint256 releaseTime) public
  TokenTimelock(_token, beneficiary, releaseTime)
  {

  }
}
