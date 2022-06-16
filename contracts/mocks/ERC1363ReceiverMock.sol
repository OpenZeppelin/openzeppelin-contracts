// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC1363/IERC1363Receiver.sol";

contract ERC1363ReceiverMock is IERC1363Receiver {
    bytes4 private _retval;
    bool private _reverts;

    event Received(address operator, address sender, uint256 amount, bytes data, uint256 gas);

    constructor(bytes4 retval, bool reverts) {
        _retval = retval;
        _reverts = reverts;
    }

    function onTransferReceived(
        address operator,
        address sender,
        uint256 amount,
        bytes memory data
    ) public override returns (bytes4) {
        require(!_reverts, "ERC1363ReceiverMock: throwing");
        emit Received(operator, sender, amount, data, gasleft());
        return _retval;
    }
}
