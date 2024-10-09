// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "../interfaces/INonceManager.sol";

/**
 * nonce management functionality
 */
abstract contract NonceManager is INonceManager {

    /**
     * The next valid sequence number for a given nonce key.
     */
    mapping(address => mapping(uint192 => uint256)) public nonceSequenceNumber;

    /// @inheritdoc INonceManager
    function getNonce(address sender, uint192 key)
    public view override returns (uint256 nonce) {
        return nonceSequenceNumber[sender][key] | (uint256(key) << 64);
    }

    // allow an account to manually increment its own nonce.
    // (mainly so that during construction nonce can be made non-zero,
    // to "absorb" the gas cost of first nonce increment to 1st transaction (construction),
    // not to 2nd transaction)
    function incrementNonce(uint192 key) public override {
        nonceSequenceNumber[msg.sender][key]++;
    }

    /**
     * validate nonce uniqueness for this account.
     * called just after validateUserOp()
     * @return true if the nonce was incremented successfully.
     *         false if the current nonce doesn't match the given one.
     */
    function _validateAndUpdateNonce(address sender, uint256 nonce) internal returns (bool) {

        uint192 key = uint192(nonce >> 64);
        uint64 seq = uint64(nonce);
        return nonceSequenceNumber[sender][key]++ == seq;
    }

}
