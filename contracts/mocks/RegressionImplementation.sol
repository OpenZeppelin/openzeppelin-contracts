// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../proxy/Initializable.sol";

contract Implementation1 is Initializable {
  uint internal _value;

  function initialize() public initializer {
  }

  function setValue(uint _number) public {
    _value = _number;
  }
}

contract Implementation2 is Initializable {
  uint internal _value;

  function initialize() public initializer {
  }

  function setValue(uint _number) public {
    _value = _number;
  }

  function getValue() public view returns (uint) {
    return _value;
  }
}

contract Implementation3 is Initializable {
  uint internal _value;

  function initialize() public initializer {
  }

  function setValue(uint _number) public {
    _value = _number;
  }

  function getValue(uint _number) public view returns (uint) {
    return _value + _number;
  }
}

contract Implementation4 is Initializable {
  uint internal _value;

  function initialize() public initializer {
  }

  function setValue(uint _number) public {
    _value = _number;
  }

  function getValue() public view returns (uint) {
    return _value;
  }

  // solhint-disable-next-line payable-fallback
  fallback() external {
    _value = 1;
  }
}
