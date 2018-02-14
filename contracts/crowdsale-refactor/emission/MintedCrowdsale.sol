pragma solidity ^0.4.18;

import "../Crowdsale.sol";
import "../../token/ERC20/MintableToken.sol";

contract MintedCrowdsale is Crowdsale {

  function _emitTokens(address _beneficiary, uint256 _tokenAmount) internal {
    MintableToken(token).mint(_beneficiary, _tokenAmount);
  }
}
