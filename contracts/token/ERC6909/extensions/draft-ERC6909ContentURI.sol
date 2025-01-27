// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC6909} from "../draft-ERC6909.sol";
import {IERC6909ContentURI} from "../../../interfaces/draft-IERC6909.sol";

/**
 * @dev Implementation of the Content URI extension defined in ERC6909.
 */
contract ERC6909ContentURI is ERC6909, IERC6909ContentURI {
    string private _contractURI;
    mapping(uint256 id => string) private _tokenURIs;

    /// @dev Event emitted when the contract URI is changed. See https://eips.ethereum.org/EIPS/eip-7572[ERC-7572] for details.
    event ContractURIUpdated();

    /// @dev See {IERC1155-URI}
    event URI(string value, uint256 indexed id);

    /// @inheritdoc IERC6909ContentURI
    function contractURI() public view virtual override returns (string memory) {
        return _contractURI;
    }

    /// @inheritdoc IERC6909ContentURI
    function tokenURI(uint256 id) public view virtual override returns (string memory) {
        return _tokenURIs[id];
    }

    /**
     * @dev Sets the {contractURI} for the contract.
     *
     * Emits a {ContractURIUpdated} event.
     */
    function _setContractURI(string memory newContractURI) internal virtual {
        _contractURI = newContractURI;

        emit ContractURIUpdated();
    }

    /**
     * @dev Sets the {tokenURI} for a given token of type `id`.
     *
     * Emits a {URI} event.
     */
    function _setTokenURI(uint256 id, string memory newTokenURI) internal virtual {
        _tokenURIs[id] = newTokenURI;

        emit URI(newTokenURI, id);
    }
}
