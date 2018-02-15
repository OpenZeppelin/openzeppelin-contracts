pragma solidity ^0.4.18;

import "../Crowdsale.sol";
import "../../token/ERC20/ERC20.sol";

contract PremintedCrowdsale is Crowdsale {

  address public tokenWallet;

  /**
   * @param _tokenWallet Address holding the tokens, which has approved allowance to the crowdsale 
   */
  function PremintedCrowdsale(address _tokenWallet) public {
    require(_tokenWallet != address(0));
    tokenWallet = _tokenWallet;
  }

  // TODO: consider querying approval left and end crowdsale if depleted
  // But approval could be increased..

  function _emitTokens(address _beneficiary, uint256 _tokenAmount) internal {
    token.transferFrom(tokenWallet, _beneficiary, _tokenAmount);
  }
}
