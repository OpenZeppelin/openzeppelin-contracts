pragma solidity ^0.5.2;

import "./RefundableCrowdsale.sol";
import "./PostDeliveryCrowdsale.sol";


/**
 * @title RefundablePostDeliveryCrowdsale
 * @dev Extension of RefundableCrowdsale contract that only delivers the tokens
 * once the crowdsale has closed and the goal met, preventing refunds to be issued
 * to token holders.
 */
contract RefundablePostDeliveryCrowdsale is RefundableCrowdsale, PostDeliveryCrowdsale {
    function withdrawTokens(address beneficiary) public {
        require(finalized(), "RefundablePostDeliveryCrowdsale: crowdsale has not been finalized yet.");
        //solhint-disable-next-line max-line-length
        require(goalReached(), "RefundablePostDeliveryCrowdsale: funding goal has not reached, cannot withdraw tokens.");

        super.withdrawTokens(beneficiary);
    }
}
