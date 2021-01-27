// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.9.0;

import "./ERC1155.sol";

/**
 * @dev ERC1155 token with totalSupply (per id).
 *
 * Useful for scenarios where Fungible and Non-fungible tokens have to be
 * clearly identified. Note: While a totalSupply of 1 might mean the
 * corresponding is an NFT, there is no guaranties that no other token with the
 * same id are not going to be minted
 */
abstract contract ERC1155Supply is ERC1155 {
    using SafeMath for uint256;

    mapping (uint256 => uint256) private _totalSupply;

    /**
     * @dev Total amount of tokens in with a given id.
     */
    function totalSupply(uint256 id) public view returns (uint256) {
        return _totalSupply[id];
    }

    /**
     * @dev Indicates weither any token exist with a given id, or not.
     */
    function _exists(uint256 id) internal view returns(bool) {
        return _totalSupply[id] > 0;
    }

    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    )
        internal
        virtual
        override
    {
        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];
            if (from == address(0)) {
                _totalSupply[id] = _totalSupply[id].add(amount);
            }
            if (to == address(0)) {
                _totalSupply[id] = _totalSupply[id].sub(amount);
            }
        }
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
