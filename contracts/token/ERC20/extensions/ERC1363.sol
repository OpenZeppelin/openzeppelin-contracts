// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ERC20.sol";
import "../../../interfaces/IERC1363.sol";
import "../../../interfaces/IERC1363Receiver.sol";
import "../../../interfaces/IERC1363Spender.sol";
import "../../../utils/introspection/ERC165.sol";
import "../../../utils/Address.sol";

abstract contract ERC1363 is IERC1363, ERC20, ERC165 {
    using Address for address;

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC165) returns (bool) {
        return interfaceId == type(IERC1363).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC1363-transferAndCall}.
     */
    function transferAndCall(address to, uint256 value) public override returns (bool) {
        return transferAndCall(to, value, bytes(""));
    }

    /**
     * @dev See {IERC1363-transferAndCall}.
     */
    function transferAndCall(
        address to,
        uint256 value,
        bytes memory data
    ) public override returns (bool) {
        require(transfer(to, value));
        require(
            _checkOnTransferReceived(_msgSender(), _msgSender(), to, value, data),
            "ERC1363: transfer to non ERC1363Receiver implementer"
        );
        return true;
    }

    /**
     * @dev See {IERC1363-transferFromAndCall}.
     */
    function transferFromAndCall(
        address from,
        address to,
        uint256 value
    ) public override returns (bool) {
        return transferFromAndCall(from, to, value, bytes(""));
    }

    /**
     * @dev See {IERC1363-transferFromAndCall}.
     */
    function transferFromAndCall(
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) public override returns (bool) {
        require(transferFrom(from, to, value));
        require(
            _checkOnTransferReceived(_msgSender(), from, to, value, data),
            "ERC1363: transfer to non ERC1363Receiver implementer"
        );
        return true;
    }

    /**
     * @dev See {IERC1363-approveAndCall}.
     */
    function approveAndCall(address spender, uint256 value) public override returns (bool) {
        return approveAndCall(spender, value, bytes(""));
    }

    /**
     * @dev See {IERC1363-approveAndCall}.
     */
    function approveAndCall(
        address spender,
        uint256 value,
        bytes memory data
    ) public override returns (bool) {
        require(approve(spender, value));
        require(
            _checkOnApprovalReceived(_msgSender(), spender, value, data),
            "ERC1363: transfer to non ERC1363Spender implementer"
        );
        return true;
    }

    /**
     * @dev Internal function to invoke {IERC1363Receiver-onTransferReceived} on a target address.
     * The call is not executed if the target address is not a contract.
     */
    function _checkOnTransferReceived(
        address operator,
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) private returns (bool) {
        try IERC1363Receiver(to).onTransferReceived(operator, from, value, data) returns (bytes4 retval) {
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
     * @dev Internal function to invoke {IERC1363Spender-onApprovalReceived} on a target address.
     * The call is not executed if the target address is not a contract.
     */
    function _checkOnApprovalReceived(
        address owner,
        address spender,
        uint256 value,
        bytes memory data
    ) private returns (bool) {
        try IERC1363Spender(spender).onApprovalReceived(owner, value, data) returns (bytes4 retval) {
            return retval == IERC1363Spender.onApprovalReceived.selector;
        } catch (bytes memory reason) {
            if (reason.length == 0) {
                revert("ERC1363: transfer to non ERC1363Spender implementer");
            } else {
                /// @solidity memory-safe-assembly
                assembly {
                    revert(add(32, reason), mload(reason))
                }
            }
        }
    }
}
