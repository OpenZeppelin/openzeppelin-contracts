pragma solidity ^0.4.23;

import "../token/ERC20/ERC20.sol";
import "../crowdsale/emission/AllowanceCrowdsale.sol";


contract AllowanceCrowdsaleImpl is AllowanceCrowdsale {

  constructor (
    uint256 _rate,
    address _wallet,
    ERC20 _token,
    address _tokenWallet
  )
    public
    Crowdsale(_rate, _wallet, _token)
    AllowanceCrowdsale(_tokenWallet)
  {
  }

}
