// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.0 (utils/escrow/ConditionalEscrow.sol)

pragma solidity ^0.8.0;

import "./Escrow.sol";

/**
 * @title ConditionalEscrow
 * @dev Base abstract escrow to only allow withdrawal if a condition is met.
 * @dev Intended usage: See {Escrow}. Same usage guidelines apply here.
 */
abstract contract ConditionalEscrow is Escrow {
    /**
     * @dev Returns whether an address is allowed to withdraw their funds. To be
     * implemented by derived contracts.
     * @param payee The destination address of the funds.
     */
    function withdrawalAllowed(address payee) public view virtual returns (bool);

    function withdraw(address payable payee) public virtual override {
        require(withdrawalAllowed(payee), "ConditionalEscrow: payee is not allowed to withdraw");
        super.withdraw(payee);
    }
}
