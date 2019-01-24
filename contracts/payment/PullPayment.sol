pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";

import "./escrow/Escrow.sol";

/**
 * @title PullPayment
 * @dev Base contract supporting async send for pull payments. Inherit from this
 * contract and use _asyncTransfer instead of send or transfer.
 */
contract PullPayment is Initializable {
    Escrow private _escrow;

    function initialize() public initializer {
        // conditional added to make initializer idempotent in case of diamond inheritance
        if (address(_escrow) == address(0)) {
            _escrow = new Escrow();
            _escrow.initialize(address(this));
        }
    }

    /**
    * @dev Withdraw accumulated balance.
    * @param payee Whose balance will be withdrawn.
    */
    function withdrawPayments(address payable payee) public {
        _escrow.withdraw(payee);
    }

    /**
    * @dev Returns the credit owed to an address.
    * @param dest The creditor's address.
    */
    function payments(address dest) public view returns (uint256) {
        return _escrow.depositsOf(dest);
    }

    /**
    * @dev Called by the payer to store the sent amount as credit to be pulled.
    * @param dest The destination address of the funds.
    * @param amount The amount to transfer.
    */
    function _asyncTransfer(address dest, uint256 amount) internal {
        _escrow.deposit.value(amount)(dest);
    }

    uint256[50] private ______gap;
}
