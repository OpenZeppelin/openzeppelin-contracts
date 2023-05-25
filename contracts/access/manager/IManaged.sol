// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./IAuthority.sol";

interface IManaged {
    function authority() external view returns (IAuthority);
}
