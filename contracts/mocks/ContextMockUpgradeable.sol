// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/ContextUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ContextMockUpgradeable is Initializable, ContextUpgradeable {
    function __ContextMock_init() internal onlyInitializing {
    }

    function __ContextMock_init_unchained() internal onlyInitializing {
    }
    event Sender(address sender);

    function msgSender() public {
        emit Sender(_msgSender());
    }

    event Data(bytes data, uint256 integerValue, string stringValue);

    function msgData(uint256 integerValue, string memory stringValue) public {
        emit Data(_msgData(), integerValue, stringValue);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}

contract ContextMockCallerUpgradeable is Initializable {
    function __ContextMockCaller_init() internal onlyInitializing {
    }

    function __ContextMockCaller_init_unchained() internal onlyInitializing {
    }
    function callSender(ContextMockUpgradeable context) public {
        context.msgSender();
    }

    function callData(
        ContextMockUpgradeable context,
        uint256 integerValue,
        string memory stringValue
    ) public {
        context.msgData(integerValue, stringValue);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
