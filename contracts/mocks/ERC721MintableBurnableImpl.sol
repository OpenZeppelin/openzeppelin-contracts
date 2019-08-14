pragma solidity ^0.5.2;

import "../token/ERC721/ERC721Full.sol";
import "../token/ERC721/ERC721Mintable.sol";
import "../token/ERC721/ERC721MetadataMintable.sol";
import "../token/ERC721/ERC721Burnable.sol";

/**
 * @title ERC721MintableBurnableImpl
 */
contract ERC721MintableBurnableImpl is ERC721Full, ERC721Mintable, ERC721MetadataMintable, ERC721Burnable {
    constructor () public {
        ERC721.initialize();
        ERC721Metadata.initialize("Test", "TEST");
        ERC721Enumerable.initialize();
        ERC721Mintable.initialize(_msgSender());
        ERC721MetadataMintable.initialize(_msgSender());
    }
}
