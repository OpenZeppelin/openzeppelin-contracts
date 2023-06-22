// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC1155/extensions/ERC1155Supply.sol)

pragma solidity ^0.8.19;

import "../ERC1155.sol";

/**
 * @dev Extension of ERC1155 that adds tracking of total supply per id.
 *
 * Useful for scenarios where Fungible and Non-fungible tokens have to be
 * clearly identified. Note: While a totalSupply of 1 might mean the
 * corresponding is an NFT, there is no guarantees that no other token with the
 * same id are not going to be minted.
 *
 * NOTE: This contract implies a global limit of 2**256 - 1 to the number of tokens
 * that can be minted.
 */
abstract contract ERC1155Supply is ERC1155 {
    mapping(uint256 => uint256) private _totalSupply;
    uint256 private _totalSupplyAll;

    /**
     * @dev Total amount of tokens in with a given id.
     */
    function totalSupply(uint256 id) public view virtual returns (uint256) {
        return _totalSupply[id];
    }

    /**
     * @dev Total amount of tokens.
     */
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupplyAll;
    }

    /**
     * @dev Indicates whether any token exist with a given id, or not.
     */
    function exists(uint256 id) public view virtual returns (bool) {
        return totalSupply(id) > 0;
    }

    /**
     * @dev See {ERC1155-_update}.
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        if (from == address(0)) {
            uint256 totalMintAmount = 0;
            for (uint256 i = 0; i < ids.length; ++i) {
                uint256 amount = amounts[i];
                _totalSupply[ids[i]] += amount;
                totalMintAmount += amount;
            }
            _totalSupplyAll += totalMintAmount;
        }

        if (to == address(0)) {
            uint256 totalBurnAmount = 0;
            for (uint256 i = 0; i < ids.length; ++i) {
                uint256 id = ids[i];
                uint256 amount = amounts[i];
                _totalSupply[id] -= amount;
                unchecked {
                    // Overflow not possible: sum(amounts[i]) <= sum(totalSupply(i)) <= totalSupplyAll
                    totalBurnAmount += amount;
                }
            }
            unchecked {
                // Overflow not possible: totalBurnAmount = sum(amounts[i]) <= sum(totalSupply(i)) <= totalSupplyAll
                _totalSupplyAll -= totalBurnAmount;
            }
        }
        super._update(from, to, ids, amounts, data);
    }
}
