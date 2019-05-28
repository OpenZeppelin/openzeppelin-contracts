pragma solidity ^0.5.2;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/validation/IndividuallyCappedCrowdsale.sol";
import "./CapperRoleMock.sol";

contract IndividuallyCappedCrowdsaleImpl is IndividuallyCappedCrowdsale, CapperRoleMock {
    constructor (uint256 rate, address payable wallet, IERC20 token) public {
        Crowdsale.initialize(rate, wallet, token);
        IndividuallyCappedCrowdsale.initialize(msg.sender);
    }
}
