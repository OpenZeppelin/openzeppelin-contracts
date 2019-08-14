pragma solidity ^0.5.2;

import "../token/ERC20/ERC20.sol";
import "../crowdsale/validation/PausableCrowdsale.sol";

contract PausableCrowdsaleImpl is PausableCrowdsale {
    constructor (uint256 _rate, address payable _wallet, ERC20 _token) public {
        Crowdsale.initialize(_rate, _wallet, _token);
        PausableCrowdsale.initialize(_msgSender());
    }
}
