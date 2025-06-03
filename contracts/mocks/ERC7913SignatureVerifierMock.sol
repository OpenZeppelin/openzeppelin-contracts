// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC7913SignatureVerifier} from "../interfaces/IERC7913.sol";

contract ERC7913MaliciousMock is IERC7913SignatureVerifier {
    function verify(bytes memory, bytes32, bytes memory) public pure returns (bytes4) {
        assembly {
            mstore(0, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
            return(0, 32)
        }
    }
}
