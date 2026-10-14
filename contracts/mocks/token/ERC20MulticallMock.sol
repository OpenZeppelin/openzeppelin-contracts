// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC20} from "../../token/ERC20/ERC20.sol";
import {Multicall} from "../../utils/Multicall.sol";

abstract contract ERC20MulticallMock is ERC20, Multicall {}
