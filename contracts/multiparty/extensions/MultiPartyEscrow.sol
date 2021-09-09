// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../utils/Context.sol";

/**
 * @title MultiPartyEscrow
 * @dev Base escrow contract for MultiParty contract, holds funds of user which can be withdrawn by them or
 * MultiParty contract. This can be used to fund a Multiparty contract in a safe and democratic way
 *
 * Intended usage:
 * This contract should be a standalone contract, that which should deployed by a Multiparty contract
 *
 * That way, users can transfer their ETH which is necessary to fund the Multiparty contract to this Escrow
 * Once deposited it can be either withdrawn by the user/the Multiparty contract in a democratic manner
 * Please read the IMultiParty specification to understand how it will be done.
 */
contract MultiPartyEscrow is Context {
    event Deposited(address indexed from, uint256 weiAmount);
    event Withdrawn(address indexed to, uint256 weiAmount);

    address public owner;
    mapping(address => uint256) private _deposits;

    constructor() {
        owner = _msgSender();
    }

    function depositsOf(address payee) public view virtual returns (uint256) {
        return _deposits[payee];
    }

    /**
     * @dev Stores the sent amount as credit to be withdrawn.
     */
    function deposit() public payable virtual {
        uint256 amount = msg.value;
        _deposits[_msgSender()] += amount;

        emit Deposited(_msgSender(), amount);
    }

    /**
     * @dev Withdraw accumulated balance for a payee.
     *
     *
     * @param from The address whose funds will be withdrawn and transferred to.
     * @param weiAmount The amount which will be transferred
     */
    function withdraw(address from, uint256 weiAmount) public virtual {
        require(_msgSender() == from || _msgSender() == owner, "Sender not authorized to receive funds");
        require(weiAmount <= _deposits[from], "Insufficient balance");

        _deposits[from] -= weiAmount;
        payable(_msgSender()).transfer(weiAmount);

        emit Withdrawn(_msgSender(), weiAmount);
    }
}
