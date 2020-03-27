pragma solidity ^0.6.0;

import "../utils/EnumerableMap.sol";

contract EnumerableMapMock {
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    event TransactionResult(bool result);

    EnumerableMap.UintToAddressMap private map;

    function contains(uint256 key) public view returns (bool) {
        return map.contains(key);
    }

    function add(uint256 key, address value) public {
        bool result = map.add(key, value);
        emit TransactionResult(result);
    }

    function remove(uint256 key) public {
        bool result = map.remove(key);
        emit TransactionResult(result);
    }

    function length() public view returns (uint256) {
        return map.length();
    }

    function at(uint256 index) public view returns (uint256 key, address value) {
        return map.at(index);
    }


    function get(uint256 key) public view returns (address) {
        return map.get(key);
    }
}
