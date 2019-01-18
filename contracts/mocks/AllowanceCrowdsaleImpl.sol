pragma solidity ^0.5.0;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/emission/AllowanceCrowdsale.sol";

contract AllowanceCrowdsaleImpl is AllowanceCrowdsale {
    constructor (uint256 rate, address payable wallet, IERC20 token, address tokenWallet)
        public
        Crowdsale(rate, wallet, token)
        AllowanceCrowdsale(tokenWallet)
    {
        // solhint-disable-previous-line no-empty-blocks
    }
}
