// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Compression} from "@openzeppelin/contracts/utils/Compression.sol";

contract CompressionTest is Test {
    using Compression for bytes;

    function testEncodeDecode(bytes memory input) external pure {
        assertEq(_flzCompress(input).flzDecompress(), input);
    }

    /// Copied from solady
    function _flzCompress(bytes memory input) private pure returns (bytes memory output) {
        assembly ("memory-safe") {
            // store 8 bytes (value) at ptr, and return updated ptr
            function ms8(ptr, value) -> ret {
                mstore8(ptr, value)
                ret := add(ptr, 1)
            }
            // load 24 bytes from a given location in memory, right aligned and in reverse order
            function u24(ptr) -> value {
                value := mload(ptr)
                value := or(shl(16, byte(2, value)), or(shl(8, byte(1, value)), byte(0, value)))
            }
            function cmp(p_, q_, e_) -> _l {
                for {
                    e_ := sub(e_, q_)
                } lt(_l, e_) {
                    _l := add(_l, 1)
                } {
                    e_ := mul(iszero(byte(0, xor(mload(add(p_, _l)), mload(add(q_, _l))))), e_)
                }
            }
            function literals(runs_, src_, dest_) -> _o {
                for {
                    _o := dest_
                } iszero(lt(runs_, 0x20)) {
                    runs_ := sub(runs_, 0x20)
                } {
                    mstore(ms8(_o, 31), mload(src_))
                    _o := add(_o, 0x21)
                    src_ := add(src_, 0x20)
                }
                if iszero(runs_) {
                    leave
                }
                mstore(ms8(_o, sub(runs_, 1)), mload(src_))
                _o := add(1, add(_o, runs_))
            }
            function mt(l_, d_, o_) -> _o {
                for {
                    d_ := sub(d_, 1)
                } iszero(lt(l_, 263)) {
                    l_ := sub(l_, 262)
                } {
                    o_ := ms8(ms8(ms8(o_, add(224, shr(8, d_))), 253), and(0xff, d_))
                }
                if iszero(lt(l_, 7)) {
                    _o := ms8(ms8(ms8(o_, add(224, shr(8, d_))), sub(l_, 7)), and(0xff, d_))
                    leave
                }
                _o := ms8(ms8(o_, add(shl(5, l_), shr(8, d_))), and(0xff, d_))
            }
            function setHash(i_, v_) {
                let p_ := add(mload(0x40), shl(2, i_))
                mstore(p_, xor(mload(p_), shl(224, xor(shr(224, mload(p_)), v_))))
            }
            function getHash(i_) -> _h {
                _h := shr(224, mload(add(mload(0x40), shl(2, i_))))
            }
            function hash(v_) -> _r {
                _r := and(shr(19, mul(2654435769, v_)), 0x1fff)
            }
            function setNextHash(ip_, ipStart_) -> _ip {
                setHash(hash(u24(ip_)), sub(ip_, ipStart_))
                _ip := add(ip_, 1)
            }

            output := mload(0x40)

            calldatacopy(output, calldatasize(), 0x8000) // Zeroize the hashmap.
            let op := add(output, 0x8000)

            let a := add(input, 0x20)

            let ipStart := a
            let ipLimit := sub(add(ipStart, mload(input)), 13)
            for {
                let ip := add(2, a)
            } lt(ip, ipLimit) {} {
                let r := 0
                let d := 0
                for {} 1 {} {
                    let s := u24(ip)
                    let h := hash(s)
                    r := add(ipStart, getHash(h))
                    setHash(h, sub(ip, ipStart))
                    d := sub(ip, r)
                    if iszero(lt(ip, ipLimit)) {
                        break
                    }
                    ip := add(ip, 1)
                    if iszero(gt(d, 0x1fff)) {
                        if eq(s, u24(r)) {
                            break
                        }
                    }
                }
                if iszero(lt(ip, ipLimit)) {
                    break
                }
                ip := sub(ip, 1)
                if gt(ip, a) {
                    op := literals(sub(ip, a), a, op)
                }
                let l := cmp(add(r, 3), add(ip, 3), add(ipLimit, 9))
                op := mt(l, d, op)
                ip := setNextHash(setNextHash(add(ip, l), ipStart), ipStart)
                a := ip
            }
            // Copy the result to compact the memory, overwriting the hashmap.
            let end := sub(literals(sub(add(ipStart, mload(input)), a), a, op), 0x7fe0)
            let o := add(output, 0x20)
            mstore(output, sub(end, o)) // Store the length.
            for {} iszero(gt(o, end)) {
                o := add(o, 0x20)
            } {
                mstore(o, mload(add(o, 0x7fe0)))
            }

            mstore(0x40, end)
        }
    }
}
