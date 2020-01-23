pragma solidity ^0.5.0;

import "../utils/EnumerableSet.sol";

contract EnumerableSetMock{
    using EnumerableSet for EnumerableSet.AddressSet;

    event TransactionResult(bool result);

    EnumerableSet.AddressSet private set;

    constructor() public {
        set = EnumerableSet.newAddressSet();
    }

    function testContains(address value) public view returns (bool) {
        return EnumerableSet.contains(set, value);
    }

    function testAdd(address value) public {
        bool result = EnumerableSet.add(set, value);
        emit TransactionResult(result);
    }

    function testRemove(address remove) public {
        bool result = EnumerableSet.remove(set, remove);
        emit TransactionResult(result);
    }

    function testEnumerate() public view returns (address[] memory) {
        return EnumerableSet.enumerate(set);
    }
}
