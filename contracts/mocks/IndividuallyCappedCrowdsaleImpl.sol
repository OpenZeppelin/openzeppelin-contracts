pragma solidity ^0.5.0;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/validation/IndividuallyCappedCrowdsale.sol";
import "./CapperRoleMock.sol";

contract IndividuallyCappedCrowdsaleImpl is IndividuallyCappedCrowdsale, CapperRoleMock {
    constructor (uint256 rate, address payable wallet, IERC20 token) public Crowdsale(rate, wallet, token) {
        // solhint-disable-previous-line no-empty-blocks
    }
}
