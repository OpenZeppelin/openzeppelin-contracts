pragma solidity ^0.5.0;
import "../utils/EnumerableSet.sol";


/**
 * @title EnumerableSetMock
 * @dev Data structure - https://en.wikipedia.org/wiki/Set_(abstract_data_type)
 * @author Alberto Cuesta Cañada
 */
contract EnumerableSetMock{
    using EnumerableSet for EnumerableSet.AddressSet;

    event TransactionResult(bool result);

    EnumerableSet.AddressSet private set;

    constructor() public {
        set = EnumerableSet.newAddressSet();
    }

    /**
     * @dev Returns true if the value is in the set.
     */
    function testContains(address value)
        public
        view
        returns (bool)
    {
        return EnumerableSet.contains(set, value);
    }

    /**
     * @dev Insert an value as the new tail.
     */
    function testAdd(address value)
        public
    {
        bool result = EnumerableSet.add(set, value);
        emit TransactionResult(result);
    }

    /**
     * @dev Remove an value.
     */
    function testRemove(address remove)
        public
    {
        bool result = EnumerableSet.remove(set, remove);
        emit TransactionResult(result);
    }

    /**
     * @dev Return an array with all values in the set, from Head to Tail.
     */
    function testEnumerate()
        public
        view
        returns (address[] memory)
    {
        return EnumerableSet.enumerate(set);
    }
}
