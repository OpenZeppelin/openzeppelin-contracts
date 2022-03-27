pragma solidity ^0.8.0;

library ModularExponentiation {
    function modExp(
        uint256 b,
        uint256 e,
        uint256 m
    ) internal returns (uint256) {
        require(m != 0, "ModularExponentiation: Can't calculate for modulus equal to zero");

        uint256 result;

        assembly {
            // Free memory pointer
            let pointer := mload(0x40)

            // Define length of base, exponent and modulus. 0x20 == 32 bytes
            mstore(pointer, 0x20)
            mstore(add(pointer, 0x20), 0x20)
            mstore(add(pointer, 0x40), 0x20)

            // Define variables base, exponent and modulus
            mstore(add(pointer, 0x60), b)
            mstore(add(pointer, 0x80), e)
            mstore(add(pointer, 0xa0), m)

            // Store the result
            let value := mload(0xc0)

            // Call the precompiled contract 0x05 = bigModExp
            if iszero(call(not(0), 0x05, 0, pointer, 0xc0, value, 0x20)) {
                revert(0, 0)
            }

            result := mload(value)
        }

        return result;
    }
}
