// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

contract CallReceiverMock {

    event MockFunctionCalled();

    uint256[] private _array;

    function mockFunction() public returns (string memory) {
        emit MockFunctionCalled();

        return "0x1234";
    }

    function mockFunctionRevertsNoReason() public pure {
        revert();
    }

    function mockFunctionRevertsReason() public pure {
        revert("CallReceiverMock: reverting");
    }

    function mockFunctionThrows() public pure {
        assert(false);
    }

    function mockFunctionOutOfGas() public {
        for (uint256 i = 0; ; ++i) {
            _array.push(i);
        }
    }
}
