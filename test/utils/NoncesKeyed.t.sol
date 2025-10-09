// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Packing.t.js.

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {NoncesKeyed} from "@openzeppelin/contracts/utils/NoncesKeyed.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

// CAUTION: Unsafe mock for testing purposes.
contract NoncesKeyedMock is NoncesKeyed {
    function useNonce(address owner, uint192 key) public returns (uint256) {
        return _useNonce(owner, key);
    }

    function useCheckedNonce(address owner, uint192 key, uint64 nonce) public {
        _useCheckedNonce(owner, key, nonce);
    }
}

contract NoncesKeyedTest is Test {
    NoncesKeyedMock private _mock;

    function setUp() public {
        _mock = new NoncesKeyedMock();
    }

    function testSymbolicUseNonce(address owner, uint192 key) public {
        uint256 prevNonce = _mock.useNonce(owner, key);
        assertEq(prevNonce + 1, _mock.nonces(owner, key));
    }

    function testSymbolicUseCheckedNonceLiveness(address owner, uint192 key) public {
        uint256 currNonce = _mock.nonces(owner, key);

        // Does not revert
        _mock.useCheckedNonce(owner, key, uint64(currNonce));
        assertEq(currNonce + 1, _mock.nonces(owner, key));
    }

    function testUseCheckedNonce(address owner, uint192 key, uint64 nonce) public {
        uint256 currNonce = _mock.nonces(owner, key);

        if (uint64(currNonce) == nonce) {
            _mock.useCheckedNonce(owner, key, nonce);
        } else {
            vm.expectRevert(abi.encodeWithSelector(Nonces.InvalidAccountNonce.selector, owner, currNonce));
            _mock.useCheckedNonce(owner, key, nonce);
        }
    }
}
