pragma solidity ^0.5.0;

import "../token/ERC20/ERC20Mintable.sol";
import "../crowdsale/emission/MintedCrowdsale.sol";

contract MintedCrowdsaleImpl is MintedCrowdsale {
    constructor (uint256 rate, address payable wallet, ERC20Mintable token) public Crowdsale(rate, wallet, token) {
        // solhint-disable-previous-line no-empty-blocks
    }
}
