pragma solidity ^0.6.0;

import "../token/ERC721/ERC721Full.sol";
import "../token/ERC721/ERC721Mintable.sol";
import "../token/ERC721/ERC721MetadataMintable.sol";
import "../token/ERC721/ERC721Burnable.sol";

/**
 * @title ERC721MintableBurnableImpl
 */
contract ERC721MintableBurnableImpl is ERC721Full, ERC721Mintable, ERC721MetadataMintable, ERC721Burnable {
    constructor () public ERC721Mintable() ERC721Full("Test", "TEST") {
        // solhint-disable-previous-line no-empty-blocks
    }

    function _afterTokenTransfer(address from, address to, uint256 tokenId) internal virtual override(ERC721, ERC721Full, ERC721Metadata) {
        super._afterTokenTransfer(from, to, tokenId);
    }
}
