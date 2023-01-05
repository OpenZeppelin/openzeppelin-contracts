// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/cryptography/SignatureChecker.sol";

contract SignatureCheckerMock {
    using SignatureChecker for address;

    function isValidSignatureNow(
        address signer,
        bytes32 hash,
        bytes memory signature
    ) public view returns (bool) {
        return signer.isValidSignatureNow(hash, signature);
    }
}
