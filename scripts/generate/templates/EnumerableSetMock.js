const format = require('../format-lines');

const TYPES = [
  { name: 'Bytes32Set', type: 'bytes32' },
  { name: 'AddressSet', type: 'address' },
  { name: 'UintSet', type: 'uint256' },
];

const header = `\
pragma solidity ^0.8.0;

import "../utils/structs/EnumerableSet.sol";
`;

const customSetMock = ({ name, type }) => `\
// ${name}
contract Enumerable${name}Mock {
    using EnumerableSet for EnumerableSet.${name};

    event OperationResult(bool result);

    EnumerableSet.${name} private _set;

    function contains(${type} value) public view returns (bool) {
        return _set.contains(value);
    }

    function add(${type} value) public {
        bool result = _set.add(value);
        emit OperationResult(result);
    }

    function remove(${type} value) public {
        bool result = _set.remove(value);
        emit OperationResult(result);
    }

    function length() public view returns (uint256) {
        return _set.length();
    }

    function at(uint256 index) public view returns (${type}) {
        return _set.at(index);
    }

    function values() public view returns (${type}[] memory) {
        return _set.values();
    }
}
`;

// GENERATE
module.exports = format(
  header,
  ...TYPES.map(details => customSetMock(details)),
);
