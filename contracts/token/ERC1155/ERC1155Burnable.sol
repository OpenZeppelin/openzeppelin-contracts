// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./ERC1155.sol";

/**
 * @dev Extension of {ERC1155} that allows token holders to destroy both their
 * own tokens and those that they have been approved to use.
 */
contract ERC1155Burnable is ERC1155 {
    /**
     * @dev Internal function to burn an amount of a token with the given ID
     * @param account Account which owns the token to be burnt
     * @param id ID of the token to be burnt
     * @param value Amount of the token to be burnt
     */
    function burn(address account, uint256 id, uint256 value) public virtual {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: need operator approval for 3rd party burns"
        );

        _burn(account, id, value);
    }

    /**
     * @dev Internal function to batch burn an amounts of tokens with the given IDs
     * @param account Account which owns the token to be burnt
     * @param ids IDs of the tokens to be burnt
     * @param values Amounts of the tokens to be burnt
     */
    function burnBatch(address account, uint256[] memory ids, uint256[] memory values) public virtual {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: need operator approval for 3rd party burns"
        );

        _burnBatch(account, ids, values);
    }
}
