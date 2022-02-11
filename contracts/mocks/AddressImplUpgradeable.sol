// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/AddressUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract AddressImplUpgradeable is Initializable {
    function __AddressImpl_init() internal onlyInitializing {
    }

    function __AddressImpl_init_unchained() internal onlyInitializing {
    }
    string public sharedAnswer;

    event CallReturnValue(string data);

    function isContract(address account) external view returns (bool) {
        return AddressUpgradeable.isContract(account);
    }

    function sendValue(address payable receiver, uint256 amount) external {
        AddressUpgradeable.sendValue(receiver, amount);
    }

    function functionCall(address target, bytes calldata data) external {
        bytes memory returnData = AddressUpgradeable.functionCall(target, data);
        emit CallReturnValue(abi.decode(returnData, (string)));
    }

    function functionCallWithValue(
        address target,
        bytes calldata data,
        uint256 value
    ) external payable {
        bytes memory returnData = AddressUpgradeable.functionCallWithValue(target, data, value);
        emit CallReturnValue(abi.decode(returnData, (string)));
    }

    function functionStaticCall(address target, bytes calldata data) external {
        bytes memory returnData = AddressUpgradeable.functionStaticCall(target, data);
        emit CallReturnValue(abi.decode(returnData, (string)));
    }

    // sendValue's tests require the contract to hold Ether
    receive() external payable {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
