// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ReentrancyGuardHybrid {
    mapping(bytes32 => bool) private _status;

    modifier nonReentrant() {
        bytes32 key = keccak256(abi.encodePacked(address(this), msg.sender, msg.sig));
        require(!_status[key], "ReentrancyGuardHybrid: reentrant call");
        _status[key] = true;
        _;
        _status[key] = false;
    }

    modifier nonReentrantNS(bytes32 namespace) {
        bytes32 key = keccak256(abi.encodePacked(namespace, msg.sender, msg.sig));
        require(!_status[key], "ReentrancyGuardHybrid: reentrant call (namespace)");
        _status[key] = true;
        _;
        _status[key] = false;
    }
}
