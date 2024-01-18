// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1155Receiver} from "../IERC1155Receiver.sol";
import {IERC1155Errors} from "../../../interfaces/draft-IERC6093.sol";

/**
 * @dev Implementation of the ERC-1155 acceptance checks used in safe transfers.
 * See https://eips.ethereum.org/EIPS/eip-1155
 */
library ERC1155Utils {
    /**
     * @dev Performs an acceptance check by calling {IERC1155-onERC1155Received} on the `to` address if it
     * contains code at the moment of execution. This will revert if the recipient doesn't accept the token transfer.
     * The call is not executed if the target address is not a contract.
     */
    function checkOnERC1155Received(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    ) internal {
        if (to.code.length > 0) {
            try IERC1155Receiver(to).onERC1155Received(operator, from, id, value, data) returns (bytes4 response) {
                if (response != IERC1155Receiver.onERC1155Received.selector) {
                    revert IERC1155Errors.ERC1155InvalidReceiver(to);
                }
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert IERC1155Errors.ERC1155InvalidReceiver(to);
                } else {
                    /// @solidity memory-safe-assembly
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        }
    }

    /**
     * @dev Performs a batch acceptance check by calling {IERC1155-onERC1155BatchReceived} on the `to` address if it
     * contains code at the moment of execution. This will revert if the recipient doesn't accept the token transfer.
     * The call is not executed if the target address is not a contract.
     */
    function checkOnERC1155BatchReceived(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) internal {
        if (to.code.length > 0) {
            try IERC1155Receiver(to).onERC1155BatchReceived(operator, from, ids, values, data) returns (
                bytes4 response
            ) {
                if (response != IERC1155Receiver.onERC1155BatchReceived.selector) {
                    revert IERC1155Errors.ERC1155InvalidReceiver(to);
                }
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert IERC1155Errors.ERC1155InvalidReceiver(to);
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
