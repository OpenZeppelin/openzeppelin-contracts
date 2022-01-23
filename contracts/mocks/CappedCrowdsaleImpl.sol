pragma solidity ^0.5.0;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/validation/CappedCrowdsale.sol";

contract CappedCrowdsaleImpl is CappedCrowdsale {
    constructor (uint256 rate, address payable wallet, IERC20 token, uint256 cap)
        public
        Crowdsale(rate, wallet, token)
        CappedCrowdsale(cap)
    {
        // solhint-disable-previous-line no-empty-blocks
    }
}
