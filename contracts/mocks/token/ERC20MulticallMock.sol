// SPDX-License-Identifier: MIT

pragma solidity >0.8.999 <0.10.0;

import {ERC20} from "../../token/ERC20/ERC20.sol";
import {Multicall} from "../../utils/Multicall.sol";

abstract contract ERC20MulticallMock is ERC20, Multicall {}
