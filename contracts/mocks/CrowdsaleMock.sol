pragma solidity ^0.5.0;

import "../crowdsale/Crowdsale.sol";

contract CrowdsaleMock is Crowdsale {
    constructor (uint256 rate, address payable wallet, IERC20 token) public Crowdsale(rate, wallet, token) {
        // solhint-disable-previous-line no-empty-blocks
    }
}
