// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (token/ERC6909/extensions/draft-ERC6909Metadata.sol)

pragma solidity ^0.8.20;

import {ERC6909} from "../draft-ERC6909.sol";
import {IERC6909Metadata} from "../../../interfaces/draft-IERC6909.sol";

contract ERC6909Metadata is ERC6909, IERC6909Metadata {
    struct TokenMetadata {
        string uri;
        string contentHash;
        uint8 decimals;
    }

    mapping(uint256 id => TokenMetadata) private _tokenMetadata;

    function name(uint256 id) external view virtual override returns (string memory) {
        return _tokenMetadata[id].uri;
    }

    function symbol(uint256 id) external view virtual override returns (string memory) {
        return _tokenMetadata[id].contentHash;
    }

    function decimals(uint256 id) external view virtual override returns (uint8) {
        return _tokenMetadata[id].decimals;
    }

    function _setTokenMetadata(uint256 id, TokenMetadata memory metadata) internal {
        _tokenMetadata[id] = metadata;
    }
}
