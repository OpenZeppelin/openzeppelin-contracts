pragma solidity ^0.6.0;

import "../token/ERC20/ERC20.sol";
import "../drafts/ERC1046/ERC20Metadata.sol";

contract ERC20MetadataMock is ERC20, ERC20Metadata {
    constructor (string memory tokenURI) public ERC20Metadata(tokenURI) { }

    function setTokenURI(string memory tokenURI) public {
        _setTokenURI(tokenURI);
    }
}
