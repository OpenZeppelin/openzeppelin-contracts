// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC721Receiver} from "../IERC721Receiver.sol";
import {IERC721Errors} from "../../../interfaces/draft-IERC6093.sol";

/**
 * @dev Implementation of the ERC-721 acceptance checks used in safe transfers.
 * See https://eips.ethereum.org/EIPS/eip-721
 */
library ERC721Utils {
    /**
     * @dev Performs an acceptance check by calling {IERC721Receiver-onERC721Received} on the `to` address if it
     * contains code at the moment of execution. This will revert if the recipient doesn't accept the token transfer.
     * The call is not executed if the target address is not a contract.
     */
    function checkOnERC721Received(
        address operator,
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(operator, from, tokenId, data) returns (bytes4 retval) {
                if (retval != IERC721Receiver.onERC721Received.selector) {
                    revert IERC721Errors.ERC721InvalidReceiver(to);
                }
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert IERC721Errors.ERC721InvalidReceiver(to);
                } else {
                    /// @solidity memory-safe-assembly
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        }
    }
}
