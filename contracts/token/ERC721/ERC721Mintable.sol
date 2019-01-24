pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";
import "./ERC721.sol";
import "../../access/roles/MinterRole.sol";

/**
 * @title ERC721Mintable
 * @dev ERC721 minting logic
 */
contract ERC721Mintable is Initializable, ERC721, MinterRole {
    function initialize(address sender) public initializer {
        require(ERC721._hasBeenInitialized());
        MinterRole.initialize(sender);
    }

    /**
     * @dev Function to mint tokens
     * @param to The address that will receive the minted tokens.
     * @param tokenId The token id to mint.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(address to, uint256 tokenId) public onlyMinter returns (bool) {
        _mint(to, tokenId);
        return true;
    }

    uint256[50] private ______gap;
}
