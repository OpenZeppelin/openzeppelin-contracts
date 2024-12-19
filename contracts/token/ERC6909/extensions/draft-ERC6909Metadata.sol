// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC6909} from "../draft-ERC6909.sol";
import {IERC6909Metadata} from "../../../interfaces/draft-IERC6909.sol";

contract ERC6909Metadata is ERC6909, IERC6909Metadata {
    struct TokenMetadata {
        string name;
        string symbol;
        uint8 decimals;
    }

    mapping(uint256 id => TokenMetadata) private _tokenMetadata;

    function name(uint256 id) external view virtual override returns (string memory) {
        return _tokenMetadata[id].name;
    }

    function symbol(uint256 id) external view virtual override returns (string memory) {
        return _tokenMetadata[id].symbol;
    }

    function decimals(uint256 id) external view virtual override returns (uint8) {
        return _tokenMetadata[id].decimals;
    }

    function _setName(uint256 id, string memory newName) internal {
        _tokenMetadata[id].name = newName;
    }

    function _setTokenSymbol(uint256 id, string memory newSymbol) internal {
        _tokenMetadata[id].symbol = newSymbol;
    }

    function _setDecimals(uint256 id, uint8 newDecimals) internal {
        _tokenMetadata[id].decimals = newDecimals;
    }

    function _setTokenMetadata(uint256 id, TokenMetadata memory metadata) internal {
        _tokenMetadata[id] = metadata;
    }
}
