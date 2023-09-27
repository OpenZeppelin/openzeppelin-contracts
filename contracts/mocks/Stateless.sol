// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

// We keep these imports and a dummy contract just to we can run the test suite after transpilation.

import {Time} from "../utils/types/Time.sol";
import {Strings} from "../utils/Strings.sol";
import {SafeCast} from "../utils/math/SafeCast.sol";
import {EnumerableMap} from "../utils/structs/EnumerableMap.sol";
import {BitMaps} from "../utils/structs/BitMaps.sol";
import {Address} from "../utils/Address.sol";
import {SignatureChecker} from "../utils/cryptography/SignatureChecker.sol";
import {Clones} from "../proxy/Clones.sol";
import {Checkpoints} from "../utils/structs/Checkpoints.sol";
import {ECDSA} from "../utils/cryptography/ECDSA.sol";
import {Create2} from "../utils/Create2.sol";
import {Arrays} from "../utils/Arrays.sol";
import {ShortStrings} from "../utils/ShortStrings.sol";
import {MerkleProof} from "../utils/cryptography/MerkleProof.sol";
import {ERC1967Utils} from "../proxy/ERC1967/ERC1967Utils.sol";
import {Math} from "../utils/math/Math.sol";
import {DoubleEndedQueue} from "../utils/structs/DoubleEndedQueue.sol";
import {StorageSlot} from "../utils/StorageSlot.sol";
import {SafeERC20} from "../token/ERC20/utils/SafeERC20.sol";
import {MessageHashUtils} from "../utils/cryptography/MessageHashUtils.sol";
import {AuthorityUtils} from "../access/manager/AuthorityUtils.sol";
import {ERC165Checker} from "../utils/introspection/ERC165Checker.sol";
import {EnumerableSet} from "../utils/structs/EnumerableSet.sol";
import {SignedMath} from "../utils/math/SignedMath.sol";
import {Base64} from "../utils/Base64.sol";

contract Dummy1234 {}
