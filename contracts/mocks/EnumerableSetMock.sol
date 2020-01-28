pragma solidity ^0.5.0;

import "../utils/EnumerableSet.sol";

contract EnumerableSetMock{
    using EnumerableSet for EnumerableSet.AddressSet;

    event TransactionResult(bool result);

    EnumerableSet.AddressSet private set;

    constructor() public {
        set = EnumerableSet.newAddressSet();
    }

    function contains(address value) public view returns (bool) {
        return EnumerableSet.contains(set, value);
    }

    function add(address value) public {
        bool result = EnumerableSet.add(set, value);
        emit TransactionResult(result);
    }

    function remove(address value) public {
        bool result = EnumerableSet.remove(set, value);
        emit TransactionResult(result);
    }

    function enumerate() public view returns (address[] memory) {
        return EnumerableSet.enumerate(set);
    }
}
