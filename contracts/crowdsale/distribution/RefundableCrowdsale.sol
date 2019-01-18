pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";
import "../../math/SafeMath.sol";
import "./FinalizableCrowdsale.sol";
import "../../payment/escrow/RefundEscrow.sol";

/**
 * @title RefundableCrowdsale
 * @dev Extension of Crowdsale contract that adds a funding goal, and the possibility of users getting a refund if goal
 * is not met.
 *
 * Deprecated, use RefundablePostDeliveryCrowdsale instead. Note that if you allow tokens to be traded before the goal
 * is met, then an attack is possible in which the attacker purchases tokens from the crowdsale and when they sees that
 * the goal is unlikely to be met, they sell their tokens (possibly at a discount). The attacker will be refunded when
 * the crowdsale is finalized, and the users that purchased from them will be left with worthless tokens.
 */
contract RefundableCrowdsale is Initializable, FinalizableCrowdsale {
    using SafeMath for uint256;

    // minimum amount of funds to be raised in weis
    uint256 private _goal;

    // refund escrow used to hold funds while crowdsale is running
    RefundEscrow private _escrow;

    /**
     * @dev Constructor, creates RefundEscrow.
     * @param goal Funding goal
     */
    function initialize(uint256 goal) public initializer {
        // FinalizableCrowdsale depends on TimedCrowdsale
        assert(TimedCrowdsale._hasBeenInitialized());

        require(goal > 0);
        // conditional added to make initializer idempotent in case of diamond inheritance
        if (address(_escrow) == address(0)) {
            _escrow = new RefundEscrow();
            _escrow.initialize(wallet(), address(this));
        }
        _goal = goal;
    }

    /**
     * @return minimum amount of funds to be raised in wei.
     */
    function goal() public view returns (uint256) {
        return _goal;
    }

    /**
     * @dev Investors can claim refunds here if crowdsale is unsuccessful
     * @param refundee Whose refund will be claimed.
     */
    function claimRefund(address payable refundee) public {
        require(finalized());
        require(!goalReached());

        _escrow.withdraw(refundee);
    }

    /**
     * @dev Checks whether funding goal was reached.
     * @return Whether funding goal was reached
     */
    function goalReached() public view returns (bool) {
        return weiRaised() >= _goal;
    }

    /**
     * @dev escrow finalization task, called when finalize() is called
     */
    function _finalization() internal {
        if (goalReached()) {
            _escrow.close();
            _escrow.beneficiaryWithdraw();
        } else {
            _escrow.enableRefunds();
        }

        super._finalization();
    }

    /**
     * @dev Overrides Crowdsale fund forwarding, sending funds to escrow.
     */
    function _forwardFunds() internal {
        _escrow.deposit.value(msg.value)(msg.sender);
    }

    uint256[50] private ______gap;
}
