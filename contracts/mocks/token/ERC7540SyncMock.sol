// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {ERC7540SyncDeposit} from "../../token/ERC20/extensions/ERC7540SyncDeposit.sol";
import {ERC7540SyncRedeem} from "../../token/ERC20/extensions/ERC7540SyncRedeem.sol";

abstract contract ERC7540SyncMock is ERC7540SyncDeposit, ERC7540SyncRedeem {}
