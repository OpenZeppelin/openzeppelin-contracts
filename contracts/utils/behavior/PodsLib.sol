// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v5.0.0 (utils/behavior/PodsLib.sol)

pragma solidity ^0.8.0;

import "../structs/EnumerableSet.sol";
import "../../interfaces/IPod.sol";

library PodsLib {
    using EnumerableSet for EnumerableSet.AddressSet;

    error PodAlreadyAdded();
    error PodNotFound();
    error InvalidPodAddress();
    error InsufficientGas();

    struct Data {
        mapping(address => EnumerableSet.AddressSet) _pods;
    }

    uint256 private constant _POD_CALL_GAS_LIMIT = 200_000;

    function hasPod(Data storage self, address account, address pod) internal view returns(bool) {
        return self._pods[account].contains(pod);
    }

    function podsCount(Data storage self, address account) internal view returns(uint256) {
        return self._pods[account].length();
    }

    function podAt(Data storage self, address account, uint256 index) internal view returns(address) {
        return self._pods[account].at(index);
    }

    function pods(Data storage self, address account) internal view returns(address[] memory) {
        return self._pods[account].values();
    }

    function addPod(Data storage self, address account, address pod, uint256 balance) internal returns(uint256) {
        return _addPod(self, account, pod, balance);
    }

    function removePod(Data storage self, address account, address pod, uint256 balance) internal {
        _removePod(self, account, pod, balance);
    }

    function removeAllPods(Data storage self, address account, uint256 balance) internal {
        _removeAllPods(self, account, balance);
    }

    function _addPod(Data storage self, address account, address pod, uint256 balance) private returns(uint256) {
        if (pod == address(0)) revert InvalidPodAddress();
        if (!self._pods[account].add(pod)) revert PodAlreadyAdded();
        if (balance > 0) {
            _updateBalances(pod, address(0), account, balance);
        }
        return self._pods[account].length();
    }

    function _removePod(Data storage self, address account, address pod, uint256 balance) private {
        if (!self._pods[account].remove(pod)) revert PodNotFound();
        if (balance > 0) {
            _updateBalances(pod, account, address(0), balance);
        }
    }

    function _removeAllPods(Data storage self, address account, uint256 balance) private {
        address[] memory items = self._pods[account].values();
        unchecked {
            for (uint256 i = items.length; i > 0; i--) {
                if (balance > 0) {
                    _updateBalances(items[i - 1], account, address(0), balance);
                }
                self._pods[account].remove(items[i - 1]);
            }
        }
    }

    function updateBalances(Data storage self, address from, address to, uint256 amount) internal {
        unchecked {
            if (amount > 0 && from != to) {
                address[] memory a = self._pods[from].values();
                address[] memory b = self._pods[to].values();
                uint256 aLength = a.length;
                uint256 bLength = b.length;

                for (uint256 i = 0; i < aLength; i++) {
                    address pod = a[i];

                    uint256 j;
                    for (j = 0; j < bLength; j++) {
                        if (pod == b[j]) {
                            // Both parties are participating of the same Pod
                            _updateBalances(pod, from, to, amount);
                            b[j] = address(0);
                            break;
                        }
                    }

                    if (j == bLength) {
                        // Sender is participating in a Pod, but receiver is not
                        _updateBalances(pod, from, address(0), amount);
                    }
                }

                for (uint256 j = 0; j < bLength; j++) {
                    address pod = b[j];
                    if (pod != address(0)) {
                        // Receiver is participating in a Pod, but sender is not
                        _updateBalances(pod, address(0), to, amount);
                    }
                }
            }
        }
    }

    /// @notice Assembly implementation of the gas limited call to avoid return gas bomb,
    // moreover call to a destructed pod would also revert even inside try-catch block in Solidity 0.8.17
    /// @dev try IPod(pod).updateBalances{gas: _POD_CALL_GAS_LIMIT}(from, to, amount) {} catch {}
    function _updateBalances(address pod, address from, address to, uint256 amount) private {
        bytes4 selector = IPod.updateBalances.selector;
        bytes4 exception = InsufficientGas.selector;
        assembly {  // solhint-disable-line no-inline-assembly
            let ptr := mload(0x40)
            mstore(ptr, selector)
            mstore(add(ptr, 0x04), from)
            mstore(add(ptr, 0x24), to)
            mstore(add(ptr, 0x44), amount)

            if lt(div(mul(gas(), 63), 64), _POD_CALL_GAS_LIMIT) {
                mstore(0, exception)
                revert(0, 4)
            }
            pop(call(_POD_CALL_GAS_LIMIT, pod, 0, ptr, 0x64, 0, 0))
        }
    }
}
