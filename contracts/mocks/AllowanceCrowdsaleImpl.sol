pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../token/ERC20/IERC20.sol";
import "../crowdsale/emission/AllowanceCrowdsale.sol";


contract AllowanceCrowdsaleImpl is Initializable, Crowdsale, AllowanceCrowdsale {

  constructor (
    uint256 rate,
    address wallet,
    IERC20 token,
    address tokenWallet
  )
    public
    Crowdsale(rate, wallet, token)
    AllowanceCrowdsale(tokenWallet)
  {
    Crowdsale.initialize(rate, wallet, token);
    AllowanceCrowdsale.initialize(tokenWallet);
  }

}
