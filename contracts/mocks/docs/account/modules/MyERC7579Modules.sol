// contracts/MyERC7579Modules.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {EIP712} from "../../../../utils/cryptography/EIP712.sol";
import {IERC7579Module, IERC7579Hook} from "../../../../interfaces/draft-IERC7579.sol";
import {ERC7579Executor} from "../../../../account/modules/ERC7579Executor.sol";
import {ERC7579Validator} from "../../../../account/modules/ERC7579Validator.sol";

// Basic validator module
abstract contract MyERC7579RecoveryValidator is ERC7579Validator {}

// Basic executor module
abstract contract MyERC7579RecoveryExecutor is ERC7579Executor {}

// Basic fallback handler
abstract contract MyERC7579RecoveryFallback is IERC7579Module {}

// Basic hook
abstract contract MyERC7579RecoveryHook is IERC7579Hook {}
