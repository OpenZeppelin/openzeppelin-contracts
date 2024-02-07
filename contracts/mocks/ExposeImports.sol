// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {P256} from "../utils/cryptography/P256.sol";

abstract contract ExposeImports {
    // This will be transpiled, causing all the imports above to be transpiled when running the upgradeable tests.
    // This trick is necessary for testing libraries such as Panic.sol (which are not imported by any other transpiled
    // contracts and would otherwise not be exposed).
}
