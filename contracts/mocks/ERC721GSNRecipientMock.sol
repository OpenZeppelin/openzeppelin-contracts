pragma solidity ^0.5.2;

import "../token/ERC721/ERC721.sol";
import "../GSN/GSNRecipient.sol";
import "../GSN/bouncers/GSNBouncerSignature.sol";

/**
 * @title ERC721GSNRecipientMock
 * A simple ERC721 mock that has GSN support enabled
 */
contract ERC721GSNRecipientMock is ERC721, GSNRecipient, GSNBouncerSignature {
    constructor(address trustedSigner) public {
        ERC721.initialize();
        GSNRecipient.initialize();
        GSNBouncerSignature.initialize(trustedSigner);
    }

    function mint(uint256 tokenId) public {
        _mint(_msgSender(), tokenId);
    }
}
