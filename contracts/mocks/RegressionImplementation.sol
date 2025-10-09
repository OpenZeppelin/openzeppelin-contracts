// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Initializable} from "../proxy/utils/Initializable.sol";

contract Implementation1 is Initializable {
    uint256 internal _value;

    function initialize() public initializer {}

    function setValue(uint256 _number) public {
        _value = _number;
    }
}

contract Implementation2 is Initializable {
    uint256 internal _value;

    function initialize() public initializer {}

    function setValue(uint256 _number) public {
        _value = _number;
    }

    function getValue() public view returns (uint256) {
        return _value;
    }
}

contract Implementation3 is Initializable {
    uint256 internal _value;

    function initialize() public initializer {}

    function setValue(uint256 _number) public {
        _value = _number;
    }

    function getValue(uint256 _number) public view returns (uint256) {
        return _value + _number;
    }
}

contract Implementation4 is Initializable {
    uint256 internal _value;

    function initialize() public initializer {}

    function setValue(uint256 _number) public {
        _value = _number;
    }

    function getValue() public view returns (uint256) {
        return _value;
    }

    fallback() external {
        _value = 1;
    }
}
