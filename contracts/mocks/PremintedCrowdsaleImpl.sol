pragma solidity ^0.4.18;

import "../token/ERC20/ERC20.sol";
import "../crowdsale/emission/PremintedCrowdsale.sol";


contract PremintedCrowdsaleImpl is PremintedCrowdsale {

  function PremintedCrowdsaleImpl (
    uint256 _rate,
    address _wallet,
    ERC20 _token,
    address _tokenWallet
  ) public
    Crowdsale(_rate, _wallet, _token)
    PremintedCrowdsale(_tokenWallet)
  {
  }

}
