pragma solidity ^0.4.24;

import "../token/ERC20/ERC20Mintable.sol";
import "../crowdsale/emission/MintedCrowdsale.sol";

contract MintedCrowdsaleImpl is MintedCrowdsale {
    constructor (uint256 rate, address wallet, ERC20Mintable token) public Crowdsale(rate, wallet, token) {}
}
