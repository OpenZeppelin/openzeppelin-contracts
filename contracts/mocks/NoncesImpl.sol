// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Nonces.sol";

contract NoncesImpl is Nonces {
    function useNonce(address owner) public {
        super._useNonce(owner);
    }
}
