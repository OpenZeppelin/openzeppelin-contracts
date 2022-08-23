const format = require('../format-lines');

const TYPES = [
  { name: 'UintToAddressMap', keyType: 'uint256', valueType: 'address' },
  { name: 'AddressToUintMap', keyType: 'address', valueType: 'uint256' },
  { name: 'Bytes32ToBytes32Map', keyType: 'bytes32', valueType: 'bytes32' },
  { name: 'UintToUintMap', keyType: 'uint256', valueType: 'uint256' },
  { name: 'Bytes32ToUintMap', keyType: 'bytes32', valueType: 'uint256' },
];

const header = `\
pragma solidity ^0.8.0;

import "../utils/structs/EnumerableMap.sol";
`;

const customSetMock = ({ name, keyType, valueType }) => `\
// ${name}
contract ${name}Mock {
    using EnumerableMap for EnumerableMap.${name};

    event OperationResult(bool result);

    EnumerableMap.${name} private _map;

    function contains(${keyType} key) public view returns (bool) {
        return _map.contains(key);
    }

    function set(${keyType} key, ${valueType} value) public {
        bool result = _map.set(key, value);
        emit OperationResult(result);
    }

    function remove(${keyType} key) public {
        bool result = _map.remove(key);
        emit OperationResult(result);
    }

    function length() public view returns (uint256) {
        return _map.length();
    }

    function at(uint256 index) public view returns (${keyType} key, ${valueType} value) {
        return _map.at(index);
    }

    function tryGet(${keyType} key) public view returns (bool, ${valueType}) {
        return _map.tryGet(key);
    }

    function get(${keyType} key) public view returns (${valueType}) {
        return _map.get(key);
    }

    function getWithMessage(${keyType} key, string calldata errorMessage) public view returns (${valueType}) {
        return _map.get(key, errorMessage);
    }
}
`;

// GENERATE
module.exports = format(
  header,
  ...TYPES.map(details => customSetMock(details)),
);
