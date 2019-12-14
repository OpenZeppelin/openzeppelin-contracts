pragma solidity ^0.5.0;

import "./ERC777.sol";
import "../../access/roles/MinterRole.sol";

/**
 * @dev Extension of {ERC777} that adds a set of accounts with the {MinterRole},
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
contract ERC777Mintable is ERC777, MinterRole {
    /**
     * @dev See {ERC777-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the {MinterRole}.
     */
    function mint(
        address operator,
        address account,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData
    ) public onlyMinter returns (bool) {
        _mint(operator, account, amount, userData, operatorData);
        return true;
    }
}
