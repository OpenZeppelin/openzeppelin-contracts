// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./MulticallTokenMockUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract MulticallTestUpgradeable is Initializable {
    function __MulticallTest_init() internal onlyInitializing {
    }

    function __MulticallTest_init_unchained() internal onlyInitializing {
    }
    function testReturnValues(
        MulticallTokenMockUpgradeable multicallToken,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        bytes[] memory calls = new bytes[](recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) {
            calls[i] = abi.encodeWithSignature("transfer(address,uint256)", recipients[i], amounts[i]);
        }

        bytes[] memory results = multicallToken.multicall(calls);
        for (uint256 i = 0; i < results.length; i++) {
            require(abi.decode(results[i], (bool)));
        }
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
