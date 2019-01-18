pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";
import "./ERC721.sol";
import "./ERC721Enumerable.sol";
import "./ERC721Metadata.sol";

/**
 * @title Full ERC721 Token
 * This implementation includes all the required and some optional functionality of the ERC721 standard
 * Moreover, it includes approve all functionality using operator terminology
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721Full is Initializable, ERC721, ERC721Enumerable, ERC721Metadata {
    function initialize(string memory name, string memory symbol) public initializer {
      ERC721Metadata.initialize(name, symbol);
    }

    uint256[50] private ______gap;
}
