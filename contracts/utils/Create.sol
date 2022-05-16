// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.7.0 (utils/Create.sol)

pragma solidity ^0.8.4;

import "./errors.sol";

/**
 * @dev Helper smart contract to make easier and safer usage of the `CREATE` EVM opcode.
 */

library Create {
    /**
     * @dev Deploys a contract using `CREATE`. The address where the contract
     * will be deployed can be known computed via {computeAddress}.
     * @param amount The value in wei to send to the new account.
     * If `amount` is non-zero, `bytecode` must have a `payable` constructor.
     * @param bytecode The creation bytecode.
     *
     * The bytecode for a contract can be obtained from Solidity with
     * `type(contractName).creationCode`.
     *
     * Requirements:
     *
     * - `bytecode` must not be empty.
     * - the factory must have a balance of at least `amount`.
     * - if `amount` is non-zero, `bytecode` must have a `payable` constructor.
     */
    function deploy(uint256 amount, bytes memory bytecode) internal returns (address) {
        address addr;
        if (address(this).balance < amount) revert InsufficientBalance(address(this));
        if (bytecode.length == 0) revert ZeroBytecodeLength(address(this));
        /// @solidity memory-safe-assembly
        assembly {
            addr := create(amount, add(bytecode, 0x20), mload(bytecode))
        }
        if (addr == address(0)) revert Failed(address(this));
        return addr;
    }

    /**
     * @dev Returns the address where a contract will be stored if deployed via {deploy}.
     * For the specification of the Recursive Length Prefix (RLP) encoding scheme, please
     * refer to p. 19 of the Ethereum Yellow Paper (https://ethereum.github.io/yellowpaper/paper.pdf)
     * and the Ethereum Wiki (https://eth.wiki/fundamentals/rlp). For further insights also, see the
     * following issue: https://github.com/Rari-Capital/solmate/issues/207.
     *
     * Based on the EIP-161 (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-161.md) specification, 
     * all contract accounts on the Ethereum mainnet are initiated with `nonce = 1`.
     * Thus, the first contract address created by another contract is calculated with a non-zero nonce.
     */
    // prettier-ignore
    function computeAddress(address addr, uint256 nonce) internal pure returns (address) {
        bytes memory data;
        bytes1 len = bytes1(0x94);

        if (nonce == 0x00) data = abi.encodePacked(bytes1(0xd6), len, addr, bytes1(0x80));
        else if (nonce <= 0x7f) data = abi.encodePacked(bytes1(0xd6), len, addr, uint8(nonce));
        else if (nonce <= type(uint8).max) data = abi.encodePacked(bytes1(0xd7), len, addr, bytes1(0x81), uint8(nonce));
        else if (nonce <= type(uint16).max)
            data = abi.encodePacked(bytes1(0xd8), len, addr, bytes1(0x82), uint16(nonce));
        else if (nonce <= type(uint24).max)
            data = abi.encodePacked(bytes1(0xd9), len, addr, bytes1(0x83), uint24(nonce));

        /**
         * @dev In the case of `nonce > type(uint24).max`, we have the following encoding scheme:
         * 0xda = 0xc0 (short RLP prefix) + 0x16 (length of: 0x94 ++ proxy ++ 0x84 ++ nonce)
         * 0x94 = 0x80 + 0x14 (0x14 = the length of an address, 20 bytes, in hex)
         * 0x84 = 0x80 + 0x04 (0x04 = the bytes length of the nonce, 4 bytes, in hex)
         */
        else data = abi.encodePacked(bytes1(0xda), len, addr, bytes1(0x84), uint32(nonce));

        return address(uint160(uint256(keccak256(data))));
    }
}
