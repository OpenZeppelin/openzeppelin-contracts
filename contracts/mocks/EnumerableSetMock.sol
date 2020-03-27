pragma solidity ^0.6.0;

import "../utils/EnumerableSet.sol";

contract EnumerableSetMock {
    using EnumerableSet for EnumerableSet.AddressSet;

    event TransactionResult(bool result);

    EnumerableSet.AddressSet private _set;

    function contains(address value) public view returns (bool) {
        return _set.contains(value);
    }

    function add(address value) public {
        bool result = _set.add(value);
        emit TransactionResult(result);
    }

    function remove(address value) public {
        bool result = _set.remove(value);
        emit TransactionResult(result);
    }

    function enumerate() public view returns (address[] memory) {
        return _set.enumerate();
    }

    function length() public view returns (uint256) {
        return _set.length();
    }

    function at(uint256 index) public view returns (address) {
        return _set.at(index);
    }
}
