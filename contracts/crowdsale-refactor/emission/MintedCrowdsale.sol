pragma solidity ^0.4.18;

import "../Crowdsale.sol";
import "../../token/ERC20/MintableToken.sol";

contract MintedCrowdsale is Crowdsale {
  
  MintableToken token;

  function MintedCrowdsale(MintableToken _token) {
    require(_token != address(0));
    token = _token;
  }

  function _emitTokens(address _beneficiary, uint256 _tokenAmount) internal {
    token.mint(_beneficiary, _tokenAmount);
  }
}
