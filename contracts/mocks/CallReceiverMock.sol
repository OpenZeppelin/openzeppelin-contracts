// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract CallReceiverMock {
    event MockFunctionCalled();
    event MockFunctionCalledWithArgs(uint256 a, uint256 b);
    event MockFunctionCalledExtra(address caller, uint256 value);

    uint256[] private _array;

    function mockFunction() public payable returns (string memory) {
        emit MockFunctionCalled();
        return "0x1234";
    }

    function mockFunctionWritesStorage(bytes32 slot, bytes32 value) public returns (string memory) {
        assembly ("memory-safe") {
            sstore(slot, value)
        }
        return "0x1234";
    }

    function mockFunctionEmptyReturn() public payable {
        emit MockFunctionCalled();
    }

    function mockFunctionEmptyReturnWritesStorage(bytes32 slot, bytes32 value) public payable {
        assembly ("memory-safe") {
            sstore(slot, value)
        }
        emit MockFunctionCalled();
    }

    function mockFunctionWithArgs(uint256 a, uint256 b) public payable returns (string memory) {
        emit MockFunctionCalledWithArgs(a, b);

        return "0x1234";
    }

    function mockFunctionWithArgsReturn(uint256 a, uint256 b) public payable returns (uint256, uint256) {
        emit MockFunctionCalledWithArgs(a, b);
        return (a, b);
    }

    function mockFunctionWithArgsReturnWritesStorage(
        bytes32 slot,
        bytes32 value,
        uint256 a,
        uint256 b
    ) public payable returns (uint256, uint256) {
        assembly ("memory-safe") {
            sstore(slot, value)
        }
        emit MockFunctionCalledWithArgs(a, b);
        return (a, b);
    }

    function mockFunctionNonPayable() public returns (string memory) {
        emit MockFunctionCalled();

        return "0x1234";
    }

    function mockStaticFunction() public pure returns (string memory) {
        return "0x1234";
    }

    function mockStaticFunctionWithArgsReturn(uint256 a, uint256 b) public pure returns (uint256, uint256) {
        return (a, b);
    }

    function mockFunctionRevertsNoReason() public payable {
        revert();
    }

    function mockFunctionRevertsReason() public payable {
        revert("CallReceiverMock: reverting");
    }

    function mockFunctionThrows() public payable {
        assert(false);
    }

    function mockFunctionOutOfGas() public payable {
        for (uint256 i = 0; ; ++i) {
            _array.push(i);
        }
    }

    function mockFunctionExtra() public payable {
        emit MockFunctionCalledExtra(msg.sender, msg.value);
    }
}

contract CallReceiverMockTrustingForwarder is CallReceiverMock {
    address private _trustedForwarder;

    constructor(address trustedForwarder_) {
        _trustedForwarder = trustedForwarder_;
    }

    function isTrustedForwarder(address forwarder) public view virtual returns (bool) {
        return forwarder == _trustedForwarder;
    }
}
