pragma solidity ^0.6.0;

contract EtherReceiverMock {
    bool private _acceptEther;

    function setAcceptEther(bool acceptEther) public {
        _acceptEther = acceptEther;
    }

    receive () external payable {
        if (!_acceptEther) {
            revert();
        }
    }
}
