// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (token/ERC6909/extensions/ERC6909Metadata.sol)

pragma solidity ^0.8.20;

import {ERC6909} from "../ERC6909.sol";
import {IERC6909Metadata} from "../../../interfaces/IERC6909.sol";

/**
 * @dev Implementation of the Metadata extension defined in ERC6909. Exposes the name, symbol, and decimals of each token id.
 */
contract ERC6909Metadata is ERC6909, IERC6909Metadata {
    struct TokenMetadata {
        string name;
        string symbol;
        uint8 decimals;
    }

    mapping(uint256 id => TokenMetadata) private _tokenMetadata;

    /// @dev The name of the token of type `id` was updated to `newName`.
    event ERC6909NameUpdated(uint256 indexed id, string newName);

    /// @dev The symbol for the token of type `id` was updated to `newSymbol`.
    event ERC6909SymbolUpdated(uint256 indexed id, string newSymbol);

    /// @dev The decimals value for token of type `id` was updated to `newDecimals`.
    event ERC6909DecimalsUpdated(uint256 indexed id, uint8 newDecimals);

    /// @inheritdoc IERC6909Metadata
    function name(uint256 id) public view virtual override returns (string memory) {
        return _tokenMetadata[id].name;
    }

    /// @inheritdoc IERC6909Metadata
    function symbol(uint256 id) public view virtual override returns (string memory) {
        return _tokenMetadata[id].symbol;
    }

    /// @inheritdoc IERC6909Metadata
    function decimals(uint256 id) public view virtual override returns (uint8) {
        return _tokenMetadata[id].decimals;
    }

    /**
     * @dev Sets the `name` for a given token of type `id`.
     *
     * Emits an {ERC6909NameUpdated} event.
     */
    function _setName(uint256 id, string memory newName) internal virtual {
        _tokenMetadata[id].name = newName;

        emit ERC6909NameUpdated(id, newName);
    }

    /**
     * @dev Sets the `symbol` for a given token of type `id`.
     *
     * Emits an {ERC6909SymbolUpdated} event.
     */
    function _setSymbol(uint256 id, string memory newSymbol) internal virtual {
        _tokenMetadata[id].symbol = newSymbol;

        emit ERC6909SymbolUpdated(id, newSymbol);
    }

    /**
     * @dev Sets the `decimals` for a given token of type `id`.
     *
     * Emits an {ERC6909DecimalsUpdated} event.
     */
    function _setDecimals(uint256 id, uint8 newDecimals) internal virtual {
        _tokenMetadata[id].decimals = newDecimals;

        emit ERC6909DecimalsUpdated(id, newDecimals);
    }
}
