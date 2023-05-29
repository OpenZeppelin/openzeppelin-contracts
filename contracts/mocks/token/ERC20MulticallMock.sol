// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../../token/ERC20/ERC20.sol";
import "../../utils/Multicall.sol";

abstract contract ERC20MulticallMock is ERC20, Multicall {}
