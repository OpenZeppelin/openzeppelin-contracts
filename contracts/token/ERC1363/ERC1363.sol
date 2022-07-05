// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC20/ERC20.sol";
import "../../utils/Address.sol";
import "../../utils/introspection/ERC165.sol";

import "./IERC1363.sol";
import "./IERC1363Receiver.sol";
import "./IERC1363Spender.sol";

/**
 * @dev Implementation of the {IERC1363} interface.
 */
abstract contract ERC1363 is IERC1363, ERC20, ERC165 {
    using Address for address;

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC1363).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC1363-transferAndCall}.
     */
    function transferAndCall(address to, uint256 amount) public virtual override returns (bool) {
        return transferAndCall(to, amount, "");
    }

    /**
     * @dev See {IERC1363-transferAndCall}.
     */
    function transferAndCall(
        address to,
        uint256 amount,
        bytes memory data
    ) public virtual override returns (bool) {
        transfer(to, amount);
        require(_checkOnTransferReceived(_msgSender(), to, amount, data), "ERC1363: receiver returned wrong data");
        return true;
    }

    /**
     * @dev See {IERC1363-transferFromAndCall}.
     */
    function transferFromAndCall(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        return transferFromAndCall(from, to, amount, "");
    }

    /**
     * @dev See {IERC1363-transferFromAndCall}.
     */
    function transferFromAndCall(
        address from,
        address to,
        uint256 amount,
        bytes memory data
    ) public virtual override returns (bool) {
        transferFrom(from, to, amount);
        require(_checkOnTransferReceived(from, to, amount, data), "ERC1363: receiver returned wrong data");
        return true;
    }

    /**
     * @dev See {IERC1363-approveAndCall}.
     */
    function approveAndCall(address spender, uint256 amount) public virtual override returns (bool) {
        return approveAndCall(spender, amount, "");
    }

    /**
     * @dev See {IERC1363-approveAndCall}.
     */
    function approveAndCall(
        address spender,
        uint256 amount,
        bytes memory data
    ) public virtual override returns (bool) {
        approve(spender, amount);
        require(_checkOnApprovalReceived(spender, amount, data), "ERC1363: spender returned wrong data");
        return true;
    }

    /**
     * @dev Internal function to invoke {IERC1363Receiver-onTransferReceived} on a target address
     *  The call is not executed if the target address is not a contract
     * @param sender address Representing the previous owner of the given token amount
     * @param recipient address Target address that will receive the tokens
     * @param amount uint256 The amount mount of tokens to be transferred
     * @param data bytes Optional data to send along with the call
     * @return whether the call correctly returned the expected magic value
     */
    function _checkOnTransferReceived(
        address sender,
        address recipient,
        uint256 amount,
        bytes memory data
    ) internal virtual returns (bool) {
        if (!recipient.isContract()) {
            revert("ERC1363: transfer to non contract address");
        }

        try IERC1363Receiver(recipient).onTransferReceived(_msgSender(), sender, amount, data) returns (bytes4 retval) {
            return retval == IERC1363Receiver.onTransferReceived.selector;
        } catch (bytes memory reason) {
            if (reason.length == 0) {
                revert("ERC1363: transfer to non ERC1363Receiver implementer");
            } else {
                /// @solidity memory-safe-assembly
                assembly {
                    revert(add(32, reason), mload(reason))
                }
            }
        }
    }

    /**
     * @dev Internal function to invoke {IERC1363Receiver-onApprovalReceived} on a target address
     *  The call is not executed if the target address is not a contract
     * @param spender address The address which will spend the funds
     * @param amount uint256 The amount of tokens to be spent
     * @param data bytes Optional data to send along with the call
     * @return whether the call correctly returned the expected magic value
     */
    function _checkOnApprovalReceived(
        address spender,
        uint256 amount,
        bytes memory data
    ) internal virtual returns (bool) {
        if (!spender.isContract()) {
            revert("ERC1363: approve a non contract address");
        }

        try IERC1363Spender(spender).onApprovalReceived(_msgSender(), amount, data) returns (bytes4 retval) {
            return retval == IERC1363Spender.onApprovalReceived.selector;
        } catch (bytes memory reason) {
            if (reason.length == 0) {
                revert("ERC1363: approve a non ERC1363Spender implementer");
            } else {
                /// @solidity memory-safe-assembly
                assembly {
                    revert(add(32, reason), mload(reason))
                }
            }
        }
    }
}
