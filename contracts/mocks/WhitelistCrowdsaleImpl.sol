pragma solidity ^0.4.24;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/validation/WhitelistCrowdsale.sol";
import "../crowdsale/Crowdsale.sol";


contract WhitelistCrowdsaleImpl is Crowdsale, WhitelistCrowdsale {
    constructor (uint256 _rate, address _wallet, IERC20 _token) Crowdsale(_rate, _wallet, _token) public {}
}
