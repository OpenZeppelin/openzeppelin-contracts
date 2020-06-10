// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../utils/Address.sol";

contract AddressImpl {
    event CallReturnValue(string data);

    function isContract(address account) external view returns (bool) {
        return Address.isContract(account);
    }

    function sendValue(address payable receiver, uint256 amount) external {
        Address.sendValue(receiver, amount);
    }

    function functionCall(address target, bytes calldata data) external {
        bytes memory returnData = Address.functionCall(target, data);

        emit CallReturnValue(abi.decode(returnData, (string)));
    }

    // sendValue's tests require the contract to hold Ether
    receive () external payable { }
}
