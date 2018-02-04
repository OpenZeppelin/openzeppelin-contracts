pragma solidity ^0.4.18;

import "../Crowdsale.sol";
import "../../token/ERC20/ERC20.sol";

contract ApprovedCrowdsale is Crowdsale {
  
  ERC20 public token;
  address public tokenOwner;

  function ApprovedCrowdsale(ERC20 _token, address _tokenOwner) {
    require(_token != address(0));
    require(_tokenOwner != address(0));
    token = _token;
    tokenOwner = _tokenOwner;
  }

  // TODO: consider querying approval left and end crowdsale if depleted 

  function emitTokens(address _beneficiary, uint256 _tokenAmount) internal {
    token.transferFrom(tokenOwner, _beneficiary, _tokenAmount);
  }
}
