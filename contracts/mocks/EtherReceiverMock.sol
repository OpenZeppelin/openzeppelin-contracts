pragma solidity ^0.5.0;

contract EtherReceiverMock {
    bool private _acceptEther;

    function setAcceptEther(bool acceptEther) public {
        _acceptEther = acceptEther;
    }

    function () external payable {
        if (!_acceptEther) {
            revert();
        }
    }
}
