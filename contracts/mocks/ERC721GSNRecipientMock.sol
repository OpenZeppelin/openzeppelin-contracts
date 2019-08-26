pragma solidity ^0.5.0;

import "../token/ERC721/ERC721.sol";
import "../GSN/GSNRecipient.sol";
import "../GSN/bouncers/GSNBouncerSignature.sol";

/**
 * @title ERC721GSNRecipientMock
 * A simple ERC721 mock that has GSN support enabled
 */
contract ERC721GSNRecipientMock is ERC721, GSNRecipient, GSNBouncerSignature {
    constructor(address trustedSigner) public GSNBouncerSignature(trustedSigner) { }
    // solhint-disable-previous-line no-empty-blocks

    function mint(uint256 tokenId) public {
        _mint(_msgSender(), tokenId);
    }
}
