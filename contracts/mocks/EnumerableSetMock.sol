pragma solidity ^0.5.10;
import "../drafts/EnumerableSet.sol";


/**
 * @title EnumerableSetMock
 * @dev Data structure
 * @author Alberto Cuesta Cañada
 */
contract EnumerableSetMock{

    using EnumerableSet for EnumerableSet.Set;

    EnumerableSet.Set private set;

    constructor() public {
        set = EnumerableSet.Set({values: new address[](0)});
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
        EnumerableSet.add(set, value);
    }

    /**
     * @dev Remove an value.
     */
    function testRemove(address remove)
        public
    {
        EnumerableSet.remove(set, remove);
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
