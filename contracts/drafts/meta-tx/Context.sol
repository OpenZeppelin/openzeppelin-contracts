pragma solidity ^0.5.0;

/*
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they not should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 */
contract Context {
    function _msgSender() internal view returns (address) {
        return msg.sender;
    }

    // This can be pure, but overrides will need to read msg.sender, which is view
    function _msgData() internal view returns (bytes memory) {
        return msg.data;
    }
}
