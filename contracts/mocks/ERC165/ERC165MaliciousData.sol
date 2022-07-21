// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract ERC165MaliciousData {
    function supportsInterface(bytes4) public view returns (bool) {
        assembly {
            mstore(0, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
            return(0, 32)
        }
    }
}
