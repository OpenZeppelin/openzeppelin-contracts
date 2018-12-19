pragma solidity ^0.5.1;

import "../crowdsale/Crowdsale.sol";

contract CrowdsaleMock is Crowdsale {
    constructor (uint256 rate, address payable wallet, IERC20 token) public Crowdsale(rate, wallet, token) {}
}
