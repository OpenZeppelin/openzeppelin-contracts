pragma solidity ^0.4.18;

import "../CrowdsaleBase.sol";
import "../../token/ERC20/MintableToken.sol";

contract MintedCrowdsale is CrowdsaleBase {
  
  MintableToken token;

  function MintedCrowdsale(MintableToken _token) {
    require(_token != address(0));
    token = _token;
  }

  function emitTokens(address _beneficiary, uint256 _tokenAmount) internal {
    token.mint(_beneficiary, _tokenAmount);
  }
}
