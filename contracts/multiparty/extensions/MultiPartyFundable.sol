// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./MultiPartyEscrow.sol";
import "../MultiParty.sol";

/**
 * @dev Additional contract of the Multiparty standard with support for democratic funding.
 * This interface can be used if the users of the contract need to fund the contract with ETH
 * in a democratic way.
 */
contract MultiPartyFundable is MultiParty {
    MultiPartyEscrow public escrow;

    constructor(address[] memory initialMembers) MultiParty(initialMembers) {
        escrow = new MultiPartyEscrow();
    }

    /**
     * @dev Allows the Multiparty contract to withdraw `value` wei belonging to `from` from the escrow contract
     *
     * So if 2 users have to fund the Multiparty contract, they will create action in following way
     * Action :
     *      withdraw(user1_address, 1 * 10^18)
     *      withdraw(user2_address, 1 * 10^18)
     *
     * Before approving and executing the above action, both users have to fund the escrow account with the needed amount of ETH
     * Here the funding happen in a secure and democratic way. Either funding happen by both users or funding does not happen at all.
     */
    function withdraw(address from, uint256 value) external virtual onlySelf returns (bool success) {
        escrow.withdraw(from, value);
        return true;
    }
}
