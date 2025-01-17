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

    /**
     * @dev Event emitted when the contract URI is changed. See https://eips.ethereum.org/EIPS/eip-7572[ERC-7572] for details.
     */
    event ContractURIUpdated();

    /**
     * @dev See {IERC4906-MetadataUpdate}. This contract does not inherit {IERC4906} as it requires {IERC721}.
     */
    event MetadataUpdate(uint256 _tokenId);

    /// @inheritdoc IERC6909ContentURI
    function contractURI() external view virtual override returns (string memory) {
        return _contractURI;
    }

    /// @inheritdoc IERC6909ContentURI
    function tokenURI(uint256 id) external view virtual override returns (string memory) {
        return _tokenURIs[id];
    }

    function _setContractURI(string memory newContractURI) internal {
        _contractURI = newContractURI;

        emit ContractURIUpdated();
    }

    function _setTokenURI(uint256 id, string memory newTokenURI) internal {
        _tokenURIs[id] = newTokenURI;

        emit MetadataUpdate(id);
    }
}
