// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4;

import {IERC165} from "./IERC165.sol";
import {IERC4626} from "./IERC4626.sol";

/// @dev Multi-Asset ERC-4626 Vaults, as defined in https://eips.ethereum.org/EIPS/eip-7575
interface IERC7575 is IERC4626, IERC165 {
    /// @dev The address of the underlying share received on deposit into the vault.
    function share() external view returns (address shareTokenAddress);
}

/// @dev Share-to-Vault lookup, as defined in https://eips.ethereum.org/EIPS/eip-7575
interface IERC7575Share {
    /// @dev The address of the vault for a specific asset.
    function vault(address asset) external view returns (address vault);
}
