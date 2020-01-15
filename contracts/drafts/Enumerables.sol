pragma solidity ^0.5.0;


/**
 * @title Enumerables
 * @dev This contract implements an enumerable address set as a doubly linked list.
 * @author Alberto Cuesta Cañada
 */
library Enumerables {

    event ObjectCreated(uint256 id, address data);
    event ObjectsLinked(uint256 prev, uint256 next);
    event ObjectRemoved(uint256 id);
    event NewHead(uint256 id);
    event NewTail(uint256 id);

    struct Object{
        uint256 id;
        uint256 next;
        uint256 prev;
        address data;
    }

    struct Enumerable{
        uint256 head;
        uint256 tail;
        uint256 idCounter;
        mapping (uint256 => Object) objects;
    }

    /**
     * @dev Retrieves the Object denoted by `id`.
     */
    function get(Enumerable storage enumerable, uint256 id)
        public
        view
        returns (uint256, uint256, uint256, address)
    {
        Object memory object = enumerable.objects[id];
        return (object.id, object.next, object.prev, object.data);
    }

    /**
     * @dev Insert a new Object as the new Head with `data` in the data field.
     */
    function append(Enumerable storage enumerable, address data)
        public
    {
        uint256 objectId = _createObject(enumerable, data);
        if (enumerable.head == 0) {
            _setHead(enumerable, objectId);
        } else {
            _link(enumerable, enumerable.head, objectId);
            _setTail(enumerable, objectId);
        }
    }

    /**
     * @dev Remove the Object denoted by `id` from the List.
     */
    function remove(Enumerable storage enumerable, uint256 id)
        public
    {
        Object memory removeObject = enumerable.objects[id];
        if (enumerable.head == id && enumerable.tail == id) {
            _setHead(enumerable, 0);
            _setTail(enumerable, 0);
        }
        else if (enumerable.head == id) {
            _setHead(enumerable, removeObject.next);
            enumerable.objects[removeObject.next].prev = 0;
        }
        else if (enumerable.tail == id) {
            _setTail(enumerable, removeObject.prev);
            enumerable.objects[removeObject.prev].next = 0;
        }
        else {
            _link(enumerable, removeObject.prev, removeObject.next);
        }
        delete enumerable.objects[removeObject.id];
        emit ObjectRemoved(id);
    }

    /**
     * @dev Returns true if at least one Object matches `data` in the data field.
     * TODO: What happens with address(0) as data?
     */
    function contains(Enumerable storage enumerable, address data)
        public
        view
        returns (bool)
    {
        Object memory object = enumerable.objects[enumerable.head];
        while (object.data != data) {
            object = enumerable.objects[object.next];
        }
        return object.data == data;
    }

    /**
     * @dev Returns the length of the enumerable.
     */
    function length(Enumerable storage enumerable)
        public
        view
        returns (uint256)
    {
        uint256 count = 0;
        if (enumerable.head != 0){
            count += 1;
            Object memory object = enumerable.objects[enumerable.head];
            while (object.id != enumerable.tail) {
                count += 1;
                object = enumerable.objects[object.next];
            }
        }
        return count;
    }

    /**
     * @dev Returns all the data fields in the enumerable, in an array ordered from head to tail.
     */
    function enumerate(Enumerable storage enumerable)
        public
        view
        returns (address[] memory)
    {
        uint256 count = length(enumerable);
        address[] memory data = new address[](count);
        Object memory object = enumerable.objects[enumerable.head];
        for (uint256 i = 0; i < count; i += 1){
            data[i] = enumerable.objects[object.id].data;
            object = enumerable.objects[object.next];
        }
        return data;
    }

    /**
     * @dev Internal function to update the Head pointer.
     */
    function _setHead(Enumerable storage enumerable, uint256 id)
        internal
    {
        enumerable.head = id;
        emit NewHead(id);
    }

    /**
     * @dev Internal function to update the Tail pointer.
     */
    function _setTail(Enumerable storage enumerable, uint256 id)
        internal
    {
        enumerable.tail = id;
        emit NewTail(id);
    }

    /**
     * @dev Internal function to create an unlinked Object.
     */
    function _createObject(Enumerable storage enumerable, address data)
        internal
        returns (uint256)
    {
        enumerable.idCounter += 1;
        uint256 newId = enumerable.idCounter;
        Object memory object = Object(
            newId,
            0,
            0,
            data
        );
        enumerable.objects[object.id] = object;
        emit ObjectCreated(
            object.id,
            object.data
        );
        return object.id;
    }

    /**
     * @dev Internal function to link an Object to another.
     */
    function _link(Enumerable storage enumerable, uint256 prevId, uint256 nextId)
        internal
    {
        enumerable.objects[prevId].next = nextId;
        enumerable.objects[nextId].prev = prevId;
        emit ObjectsLinked(prevId, nextId);
    }
}
