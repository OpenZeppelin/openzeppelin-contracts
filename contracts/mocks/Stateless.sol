// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

// We keep these imports and a dummy contract just to we can run the test suite after transpilation.

import {Address} from "../utils/Address.sol";
import {Arrays} from "../utils/Arrays.sol";
import {AuthorityUtils} from "../access/manager/AuthorityUtils.sol";
import {Base64} from "../utils/Base64.sol";
import {BitMaps} from "../utils/structs/BitMaps.sol";
import {Checkpoints} from "../utils/structs/Checkpoints.sol";
import {CircularBuffer} from "../utils/structs/CircularBuffer.sol";
import {Clones} from "../proxy/Clones.sol";
import {Create2} from "../utils/Create2.sol";
import {DoubleEndedQueue} from "../utils/structs/DoubleEndedQueue.sol";
import {ECDSA} from "../utils/cryptography/ECDSA.sol";
import {EnumerableMap} from "../utils/structs/EnumerableMap.sol";
import {EnumerableSet} from "../utils/structs/EnumerableSet.sol";
import {ERC1155Holder} from "../token/ERC1155/utils/ERC1155Holder.sol";
import {ERC165} from "../utils/introspection/ERC165.sol";
import {ERC165Checker} from "../utils/introspection/ERC165Checker.sol";
import {ERC1967Utils} from "../proxy/ERC1967/ERC1967Utils.sol";
import {ERC721Holder} from "../token/ERC721/utils/ERC721Holder.sol";
import {Math} from "../utils/math/Math.sol";
import {MerkleProof} from "../utils/cryptography/MerkleProof.sol";
import {MessageHashUtils} from "../utils/cryptography/MessageHashUtils.sol";
import {P256} from "../utils/cryptography/P256.sol";
import {Panic} from "../utils/Panic.sol";
import {Packing} from "../utils/Packing.sol";
import {RSA} from "../utils/cryptography/RSA.sol";
import {SafeCast} from "../utils/math/SafeCast.sol";
import {SafeERC20} from "../token/ERC20/utils/SafeERC20.sol";
import {ShortStrings} from "../utils/ShortStrings.sol";
import {SignatureChecker} from "../utils/cryptography/SignatureChecker.sol";
import {SignedMath} from "../utils/math/SignedMath.sol";
import {StorageSlot} from "../utils/StorageSlot.sol";
import {Strings} from "../utils/Strings.sol";
import {Time} from "../utils/types/Time.sol";

contract Dummy1234 {}
