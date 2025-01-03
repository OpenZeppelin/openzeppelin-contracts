// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC6909} from "../draft-ERC6909.sol";
import {IERC6909ContentURI} from "../../../interfaces/draft-IERC6909.sol";

contract ERC6909ContentURI is ERC6909, IERC6909ContentURI {
    string private _contractURI;
    mapping(uint256 id => string) private _tokenURIs;

    function contractURI() external view virtual override returns (string memory) {
        return _contractURI;
    }

    function tokenURI(uint256 id) external view virtual override returns (string memory) {
        return _tokenURIs[id];
    }

    function _setContractURI(string memory newContractURI) internal {
        _contractURI = newContractURI;
    }

    function _setTokenURI(uint256 id, string memory newTokenURI) internal {
        _tokenURIs[id] = newTokenURI;
    }
}
