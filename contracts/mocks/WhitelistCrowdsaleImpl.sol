pragma solidity ^0.5.2;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/validation/WhitelistCrowdsale.sol";
import "../crowdsale/Crowdsale.sol";

contract WhitelistCrowdsaleImpl is Crowdsale, WhitelistCrowdsale {
    constructor (uint256 _rate, address payable _wallet, IERC20 _token) public {
        Crowdsale.initialize(_rate, _wallet, _token);
        WhitelistCrowdsale.initialize(_msgSender());
    }
}
