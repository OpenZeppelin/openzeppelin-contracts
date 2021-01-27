// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../GSN/Context.sol";
import "../../utils/Address.sol";
import "./ERC20.sol";
import "./IERC667.sol";
import "./IERC667Receiver.sol";

/**
 * @title ERC667 Token standard
 *
 * @dev Extension of {ERC20} that allows direct transfer of tokens to smart
 * contracts that bypass the approve-transfer pattern.
 *
 * see https://github.com/ethereum/EIPs/issues/677
 */
abstract contract ERC667 is Context, ERC20, IERC667 {
    using Address for address;

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient` and
     * call {IERC667Receiver-onTokenTransfer}` on the recipient.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferAndCall(address receiver, uint amount, bytes memory data) public virtual override returns (bool) {
        _transfer(_msgSender(), receiver, amount);
        require(_checkOnERC667Received(_msgSender(), receiver, amount, data), "ERC667: transferAndCall to non ERC667Receiver implementer");
        return true;
    }

    /**
     * @dev Internal function to invoke {IERC667Receiver-onTokenTransfer} on a
     * target address.
     *
     * @param from address representing the tokens sender
     * @param receiver target address that will receive the tokens
     * @param amount quantity of tokens transfered
     * @param data bytes optional data to send along with the call
     * @return bool whether the call correctly returned the expected value
     */
    function _checkOnERC667Received(address from, address receiver, uint256 amount, bytes memory data) private returns (bool)
    {
        try IERC667Receiver(receiver).onTokenTransfer(from, amount, data) returns (bool success) {
            return success;
        } catch {
            return false;
        }
    }
}
