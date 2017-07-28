pragma solidity ^0.4.11;


import "../../token/MintableToken.sol";


/**
 * @title SampleCrowdsaleToken
 * @dev Very simple ERC20 Token that can be minted.
 * It is meant to be used in a crowdsale contract.
 */
contract SampleCrowdsaleToken is MintableToken {

  string public constant name = "Sample Crowdsale Token";
  string public constant symbol = "SCT";
  uint256 public constant decimals = 18;

}
