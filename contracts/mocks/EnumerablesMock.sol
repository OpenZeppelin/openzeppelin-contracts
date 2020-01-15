pragma solidity ^0.5.0;
import "../drafts/Enumerables.sol";


contract EnumerablesMock {
    using Enumerables for Enumerables.Enumerable;

    Enumerables.Enumerable public enumerable;

    constructor() public {
        enumerable = Enumerables.Enumerable(0, 0, 0); // Maybe have a factory method in the library.
    }

    /**
     * @dev Retrieves the Object denoted by `id`.
     */
    function testGet(uint256 id)
        public
        view
        returns (uint256, uint256, uint256, address)
    {
        return Enumerables.get(enumerable, id);
    }

    /**
     * @dev Insert a new Object as the new Head with `data` in the data field.
     */
    function testAppend(address data)
        public
    {
        Enumerables.append(enumerable, data);
    }

    /**
     * @dev Remove the Object denoted by `id` from the List.
     */
    function testRemove(uint256 id)
        public
    {
        Enumerables.remove(enumerable, id);
    }

    /**
     * @dev Returns true if at least one Object matches `data` in the data field.
     * TODO: What happens with address(0) as data?
     */
    function testContains(address data)
        public
        view
        returns (bool)
    {

        return Enumerables.contains(enumerable, data);
    }

    /**
     * @dev Returns the length of the enumerable.
     */
    function testLength()
        public
        view
        returns (uint256)
    {
        return Enumerables.length(enumerable);
    }

    /**
     * @dev Returns all the data fields in the enumerable, in an array ordered from head to tail.
     */
    function enumerate()
        public
        view
        returns (address[] memory)
    {
        return Enumerables.enumerate(enumerable);
    }

    /**
     * @dev Internal function to update the Head pointer.
     */
    function testSetHead(uint256 id)
        public
    {
        Enumerables._setHead(enumerable, id);
    }

    /**
     * @dev Internal function to update the Tail pointer.
     */
    function testSetTail(uint256 id)
        public
    {
        Enumerables._setTail(enumerable, id);
    }

    /**
     * @dev Internal function to create an unlinked Object.
     */
    function testCreateObject(address data)
        public
        returns (uint256)
    {
        return Enumerables._createObject(enumerable, data);
    }

    /**
     * @dev Internal function to link an Object to another.
     */
    function testLink(uint256 prevId, uint256 nextId)
        public
    {
        Enumerables._link(enumerable, prevId, nextId);
    }
}
