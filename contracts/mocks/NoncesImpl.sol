// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Nonces.sol";

contract NoncesImpl {
    using Nonces for Nonces.Data;

    Nonces.Data private _nonces;

    function nonces(address owner) public view returns (uint256) {
        return _nonces.nonces(owner);
    }

    function useNonce(address owner) public {
        _nonces.useNonce(owner);
    }
}
