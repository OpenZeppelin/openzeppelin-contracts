// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../utils/SignatureChecker.sol";

contract SignatureCheckerMock {
    using SignatureChecker for address;

    function isValidSignature(address signer, bytes32 hash, bytes memory signature) public view returns (bool) {
        return signer.isValidSignature(hash, signature);
    }
}
