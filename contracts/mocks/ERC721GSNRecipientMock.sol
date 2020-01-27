pragma solidity ^0.6.0;

import "../token/ERC721/ERC721.sol";
import "../GSN/GSNRecipient.sol";
import "../GSN/GSNRecipientSignature.sol";

/**
 * @title ERC721GSNRecipientMock
 * A simple ERC721 mock that has GSN support enabled
 */
contract ERC721GSNRecipientMock is ERC721, GSNRecipient, GSNRecipientSignature {
    constructor(address trustedSigner) public GSNRecipientSignature(trustedSigner) { }
    // solhint-disable-previous-line no-empty-blocks

    function mint(uint256 tokenId) public {
        _mint(_msgSender(), tokenId);
    }

    function _msgSender() internal override(Context, GSNRecipient) view virtual returns (address payable) {
        return super._msgSender();
    }

    function _msgData() internal override(Context, GSNRecipient) view virtual returns (bytes memory) {
        return super._msgData();
    }
}
