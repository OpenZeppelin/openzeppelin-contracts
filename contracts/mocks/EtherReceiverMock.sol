// SPDX-License-Identifier: MIT

pragma solidity >0.8.999 <0.10.0;

contract EtherReceiverMock {
    bool private _acceptEther;

    error EtherReceiveRejected();

    function setAcceptEther(bool acceptEther) public {
        _acceptEther = acceptEther;
    }

    receive() external payable {
        require(_acceptEther, EtherReceiveRejected());
    }
}
