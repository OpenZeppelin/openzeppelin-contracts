// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC20} from "../ERC20.sol";
import {IERC165, ERC165} from "../../../utils/introspection/ERC165.sol";

import {IERC1363} from "../../../interfaces/IERC1363.sol";
import {IERC1363Receiver} from "../../../interfaces/IERC1363Receiver.sol";
import {IERC1363Spender} from "../../../interfaces/IERC1363Spender.sol";

/**
 * @title ERC1363
 * @dev Extension of {ERC20} tokens that adds support for code execution after transfers and approvals
 * on recipient contracts. Calls after transfers are enabled through the {ERC1363-transferAndCall} and
 * {ERC1363-transferFromAndCall} methods while calls after approvals can be made with {ERC1363-approveAndCall}
 */
abstract contract ERC1363 is ERC20, ERC165, IERC1363 {
    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC1363InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the token `spender`. Used in approvals.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC1363InvalidSpender(address spender);

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC1363).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @inheritdoc IERC1363
     *
     * @notice Reverts if `to` is an account without code or the recipient contract does not implement
     * {IERC1363Receiver-onTransferReceived}
     */
    function transferAndCall(address to, uint256 value) public virtual returns (bool) {
        return transferAndCall(to, value, "");
    }

    /**
     * @inheritdoc IERC1363
     *
     * @notice Reverts if `to` is an account without code or the recipient contract does not implement
     * {IERC1363Receiver-onTransferReceived}
     */
    function transferAndCall(address to, uint256 value, bytes memory data) public virtual returns (bool) {
        transfer(to, value);
        _checkOnTransferReceived(_msgSender(), to, value, data);
        return true;
    }

    /**
     * @inheritdoc IERC1363
     *
     * @notice Reverts if `to` is an account without code or the recipient contract does not implement
     * {IERC1363Receiver-onTransferReceived}
     */
    function transferFromAndCall(address from, address to, uint256 value) public virtual returns (bool) {
        return transferFromAndCall(from, to, value, "");
    }

    /**
     * @inheritdoc IERC1363
     *
     * @notice Reverts if `to` is an account without code or the recipient contract does not implement
     * {IERC1363Receiver-onTransferReceived}
     */
    function transferFromAndCall(
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) public virtual returns (bool) {
        transferFrom(from, to, value);
        _checkOnTransferReceived(from, to, value, data);
        return true;
    }

    /**
     * @inheritdoc IERC1363
     *
     * @notice Reverts if `spender` is an account without code or the spender contract does not implement
     * {IERC1363Spender-onApprovalReceived}
     */
    function approveAndCall(address spender, uint256 value) public virtual returns (bool) {
        return approveAndCall(spender, value, "");
    }

    /**
     * @inheritdoc IERC1363
     *
     * @notice Reverts if `spender` is an account without code or the spender contract does not implement
     * {IERC1363Spender-onApprovalReceived}
     */
    function approveAndCall(address spender, uint256 value, bytes memory data) public virtual returns (bool) {
        approve(spender, value);
        _checkOnApprovalReceived(spender, value, data);
        return true;
    }

    /**
     * @dev Performs a call to {IERC1363Receiver-onTransferReceived} on a target address.
     * This will revert if the target doesn't implement the {IERC1363Receiver} interface or
     * if the target doesn't accept the token transfer or
     * if the target address is not a contract.
     */
    function _checkOnTransferReceived(address from, address to, uint256 value, bytes memory data) private {
        if (to.code.length == 0) {
            revert ERC1363InvalidReceiver(to);
        }

        try IERC1363Receiver(to).onTransferReceived(_msgSender(), from, value, data) returns (bytes4 retval) {
            if (retval != IERC1363Receiver.onTransferReceived.selector) {
                revert ERC1363InvalidReceiver(to);
            }
        } catch (bytes memory reason) {
            if (reason.length == 0) {
                revert ERC1363InvalidReceiver(to);
            } else {
                /// @solidity memory-safe-assembly
                assembly {
                    revert(add(32, reason), mload(reason))
                }
            }
        }
    }

    /**
     * @dev Performs a call to {IERC1363Spender-onApprovalReceived} on a target address.
     * This will revert if the target doesn't implement the {IERC1363Spender} interface or
     * if the target doesn't accept the token approval or
     * if the target address is not a contract.
     */
    function _checkOnApprovalReceived(address spender, uint256 value, bytes memory data) private {
        if (spender.code.length == 0) {
            revert ERC1363InvalidSpender(spender);
        }

        try IERC1363Spender(spender).onApprovalReceived(_msgSender(), value, data) returns (bytes4 retval) {
            if (retval != IERC1363Spender.onApprovalReceived.selector) {
                revert ERC1363InvalidSpender(spender);
            }
        } catch (bytes memory reason) {
            if (reason.length == 0) {
                revert ERC1363InvalidSpender(spender);
            } else {
                /// @solidity memory-safe-assembly
                assembly {
                    revert(add(32, reason), mload(reason))
                }
            }
        }
    }
}
