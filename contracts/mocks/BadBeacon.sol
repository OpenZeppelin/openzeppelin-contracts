// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract BadBeacon {
    function implementation() external pure returns (address) {
        return address(0); // ← adresse explicitement invalide
    }
}