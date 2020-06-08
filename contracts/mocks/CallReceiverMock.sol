// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

contract CallReceiverMock {
  
    event MockFunctionCalled();
    
    function mockFunction() public {
        emit MockFunctionCalled();
    }

    function mockFunctionReverts() public pure {
        revert();
    }
}
