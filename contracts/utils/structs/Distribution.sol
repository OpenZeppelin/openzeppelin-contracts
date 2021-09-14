// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library Distribution {
    struct AddressToUintWithTotal {
        mapping(address => uint256) _values;
        uint256 _total;
    }

    function getValue(AddressToUintWithTotal storage store, address account) internal view returns (uint256) {
        return store._values[account];
    }

    function getTotal(AddressToUintWithTotal storage store) internal view returns (uint256) {
        return store._total;
    }

    function add(
        AddressToUintWithTotal storage store,
        address account,
        uint256 value
    ) internal {
        store._values[account] += value;
        store._total += value;
    }

    function sub(
        AddressToUintWithTotal storage store,
        address account,
        uint256 value
    ) internal {
        store._values[account] -= value;
        store._total -= value;
    }

    function move(
        AddressToUintWithTotal storage store,
        address from,
        address to,
        uint256 value
    ) internal {
        store._values[from] -= value;
        store._values[to] += value;
    }

    struct AddressToIntWithTotal {
        mapping(address => int256) _values;
        int256 _total;
    }

    function getValue(AddressToIntWithTotal storage store, address account) internal view returns (int256) {
        return store._values[account];
    }

    function getTotal(AddressToIntWithTotal storage store) internal view returns (int256) {
        return store._total;
    }

    function add(
        AddressToIntWithTotal storage store,
        address account,
        int256 value
    ) internal {
        store._values[account] += value;
        store._total += value;
    }

    function sub(
        AddressToIntWithTotal storage store,
        address account,
        int256 value
    ) internal {
        store._values[account] -= value;
        store._total -= value;
    }

    function move(
        AddressToIntWithTotal storage store,
        address from,
        address to,
        int256 value
    ) internal {
        store._values[from] -= value;
        store._values[to] += value;
    }
}
