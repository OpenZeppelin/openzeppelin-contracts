pragma solidity ^0.4.18;

import "../token/ERC20/TokenVesting.sol";
import "../token/ERC20/MintableToken.sol";




/**
 * @title SampleTokenVestingToken
 * @dev Very simple ERC20 Token that can be minted.
 * It is meant to be used in a token time lock contract.
 */

contract SampleTokenVestingToken is MintableToken {


  string public constant name = "Sample Token Vesting Token"; // solium-disable-line uppercase
  string public constant symbol = "STT"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase


}

/**
 * @title SampleTokenVesting
 * @dev This is an example of a TokenVesting
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * In this example we are providing following extensions:
 * TokenVesting - sets a max boundary for raised funds
 *
 */




contract SampleTokenVesting is TokenVesting {

  function SampleTokenVesting(address _beneficiary, uint256 _start, uint256 _cliff, uint256 _duration, bool _revocable) public


  TokenVesting(_beneficiary, _start, _cliff, _duration, _revocable)
  {


  }
}
