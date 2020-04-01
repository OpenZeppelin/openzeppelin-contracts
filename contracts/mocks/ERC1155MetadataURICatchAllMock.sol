pragma solidity ^0.6.0;

import "../token/ERC1155/ERC1155MetadataURICatchAll.sol";

/**
 * @title ERC1155MetadataURICatchAllMock
 * This mock just publicizes internal functions for testing purposes
 * (mint is not specific to the tested contract but required by shouldBehaveLikeERC1155)
 */
contract ERC1155MetadataURICatchAllMock is ERC1155MetadataURICatchAll {
    constructor (string memory uri) public ERC1155MetadataURICatchAll(uri) {
        // solhint-disable-previous-line no-empty-blocks
    }

    function mint(address to, uint256 id, uint256 value, bytes memory data) public {
        _mint(to, id, value, data);
    }

    function setURI(string memory newuri) public {
        _setURI(newuri);
    }
}
