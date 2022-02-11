// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/CountersUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract CountersImplUpgradeable is Initializable {
    function __CountersImpl_init() internal onlyInitializing {
    }

    function __CountersImpl_init_unchained() internal onlyInitializing {
    }
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _counter;

    function current() public view returns (uint256) {
        return _counter.current();
    }

    function increment() public {
        _counter.increment();
    }

    function decrement() public {
        _counter.decrement();
    }

    function reset() public {
        _counter.reset();
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
