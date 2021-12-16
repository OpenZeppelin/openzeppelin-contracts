// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.0 (token/ERC1155/extensions/ERC1155Royalty.sol)

pragma solidity ^0.8.0;

import "../ERC1155.sol";
import "../../common/ERC2981.sol";
import "../../../utils/introspection/ERC165.sol";

/**
 * @dev Implementation of the ERC1155 Royalty extension allowing royalty information to be stored and retrieved, as defined in
 * https://eips.ethereum.org/EIPS/eip-2981[EIP-2981].
 *
 * Adds the {_setTokenRoyalty} methods to set the token royalty information, and {_setDefaultRoyalty} method to set a default
 * royalty information.
 *
 * NOTE: As specified in EIP-2981, royalties are technically optional and payment is not enforced by this contract.
 * See https://eips.ethereum.org/EIPS/eip-2981#optional-royalty-payments[Rationale] in the EIP.
 *
 * _Available since v4.5._
 */
abstract contract ERC1155Royalty is ERC2981, ERC1155 {
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, ERC2981) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Destroys `tokenId`.
     * The royalty information is cleared when the token is burned.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     *
     * Emits a {Transfer} event.
     */
    function _burn(
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual override {
        super._burn(from, id, amount);
        _resetTokenRoyalty(id);
    }
}
