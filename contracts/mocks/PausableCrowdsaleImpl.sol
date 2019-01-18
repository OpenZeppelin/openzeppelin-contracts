pragma solidity ^0.5.0;

import "../token/ERC20/ERC20.sol";
import "../crowdsale/validation/PausableCrowdsale.sol";

contract PausableCrowdsaleImpl is PausableCrowdsale {
    constructor (uint256 _rate, address payable _wallet, ERC20 _token) public Crowdsale(_rate, _wallet, _token) {
        // solhint-disable-previous-line no-empty-blocks
    }
}
