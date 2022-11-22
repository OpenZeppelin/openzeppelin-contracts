// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract EtherReceiverMock {
    uint256 private constant _ACCEPTETHER_FALSE = 1;
    uint256 private constant _ACCEPTETHER_TRUE = 2;
    uint256 private _acceptEther = _ACCEPTETHER_FALSE;

    function setAcceptEther(bool acceptEther) public {
        _acceptEther = acceptEther ? _ACCEPTETHER_TRUE : _ACCEPTETHER_FALSE;
    }

    receive() external payable {
        if (_acceptEther == _ACCEPTETHER_FALSE) {
            revert();
        }
    }
}
