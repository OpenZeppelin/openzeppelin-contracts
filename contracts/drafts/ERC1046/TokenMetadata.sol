pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";
import "../../token/ERC20/IERC20.sol";

/**
 * @title ERC-1047 Token Metadata
 * @dev See https://eips.ethereum.org/EIPS/eip-1046
 * @dev tokenURI must respond with a URI that implements https://eips.ethereum.org/EIPS/eip-1047
 */
contract ERC20TokenMetadata is Initializable, IERC20 {
    function tokenURI() external view returns (string memory);

    uint256[50] private ______gap;
}

contract ERC20WithMetadata is Initializable, ERC20TokenMetadata {
    string private _tokenURI;

    function initialize(string memory tokenURI) public {
        _tokenURI = tokenURI;
    }

    function tokenURI() external view returns (string memory) {
        return _tokenURI;
    }

    uint256[50] private ______gap;
}
