pragma solidity ^0.4.24;

import "./PostDeliveryCrowdsale.sol";
import "./RefundableCrowdsale.sol";


/**
 * @title PostDeliveryRefundableCrowdsale
 * @dev Extension of RefundableCrowdsale contract that only delivers the tokens
 * once the crowdsale has closed and the goal met, preventing refunds to be issued
 * to token holders.
 */
contract PostDeliveryRefundableCrowdsale is PostDeliveryCrowdsale, RefundableCrowdsale {
    function withdrawTokens(address beneficiary) public {
        require(finalized());
        require(goalReached());

        super.withdrawTokens(beneficiary);
    }
}
