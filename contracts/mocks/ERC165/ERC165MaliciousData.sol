// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract ERC165MaliciousData {
    function supportsInterface(bytes4) public pure returns (bool) {
        assembly {
            mstore(0, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
            return(0, 32)
        }
    }
}
