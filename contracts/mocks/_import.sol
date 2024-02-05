// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Address} from "../utils/Address.sol";
import {Arrays} from "../utils/Arrays.sol";
import {Base64} from "../utils/Base64.sol";
import {BitMaps} from "../utils/structs/BitMaps.sol";
import {Checkpoints} from "../utils/structs/Checkpoints.sol";
import {Context} from "../utils/Context.sol";
import {Create2} from "../utils/Create2.sol";
import {DoubleEndedQueue} from "../utils/structs/DoubleEndedQueue.sol";
import {ECDSA} from "../utils/cryptography/ECDSA.sol";
import {EIP712} from "../utils/cryptography/EIP712.sol";
import {EnumerableMap} from "../utils/structs/EnumerableMap.sol";
import {EnumerableSet} from "../utils/structs/EnumerableSet.sol";
import {ERC165} from "../utils/introspection/ERC165.sol";
import {ERC165Checker} from "../utils/introspection/ERC165Checker.sol";
import {IERC165} from "../utils/introspection/IERC165.sol";
import {Math} from "../utils/math/Math.sol";
import {MerkleProof} from "../utils/cryptography/MerkleProof.sol";
import {MessageHashUtils} from "../utils/cryptography/MessageHashUtils.sol";
import {Multicall} from "../utils/Multicall.sol";
import {Nonces} from "../utils/Nonces.sol";
import {Panic} from "../utils/Panic.sol";
import {Pausable} from "../utils/Pausable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {SafeCast} from "../utils/math/SafeCast.sol";
import {ShortStrings} from "../utils/ShortStrings.sol";
import {SignatureChecker} from "../utils/cryptography/SignatureChecker.sol";
import {SignedMath} from "../utils/math/SignedMath.sol";
import {StorageSlot} from "../utils/StorageSlot.sol";
import {Strings} from "../utils/Strings.sol";
import {Time} from "../utils/types/Time.sol";

abstract contract ExposeImports {
    // This will be transpiled, causing all the imports above to be transpiled when running the upgradeable tests.
    // This trick is necessary for testing libraries such as Panic.sol (which are not imported by any other transpiled
    // contracts and would otherwise not be exposed).
}
