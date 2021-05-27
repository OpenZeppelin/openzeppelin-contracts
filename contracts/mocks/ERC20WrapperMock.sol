// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/ERC20Wrapper.sol";

contract ERC20WrapperMock is ERC20Wrapper {
    constructor(IERC20 _underlyingToken, string memory name, string memory symbol)
    ERC20(name, symbol)
    ERC20Wrapper(_underlyingToken)
    {}
}
