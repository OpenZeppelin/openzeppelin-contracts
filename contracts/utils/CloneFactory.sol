pragma solidity ^0.4.24;

/*
The MIT License (MIT)

Copyright (c) 2018 Murray Software, LLC.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * @title EIP 1167: Minimal Proxy Contract
 *
 * @dev To simply and cheaply clone contract functionality in an immutable way,
 * this standard specifies a minimal bytecode implementation that delegates
 * all calls to a known, fixed address.
 *
 * https://eips.ethereum.org/EIPS/eip-1167
 */
contract CloneFactory {

  event CloneCreated(address indexed originAddress, address clonedAddress);

  function createClone(address target) internal returns (address result) {
    // solium-disable-next-line
    bytes memory clone = hex"3d602d80600a3d3981f3363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3";
    bytes20 targetBytes = bytes20(target);
    for (uint i = 0; i < 20; i++) {
      clone[20 + i] = targetBytes[i];
    }
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      let len := mload(clone)
      let data := add(clone, 0x20)
      result := create(0, data, len)
    }
    emit CloneCreated(target, result);
  }
}
