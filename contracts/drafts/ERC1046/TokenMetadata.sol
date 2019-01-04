pragma solidity ^0.5.0;

import "../../token/ERC20/IERC20.sol";

/**
 * @title ERC-1047 Token Metadata
 * @dev See https://eips.ethereum.org/EIPS/eip-1046
 * @dev tokenURI must respond with a URI that implements https://eips.ethereum.org/EIPS/eip-1047
 */
contract ERC20TokenMetadata is IERC20 {
    function tokenURI() external view returns (string memory);
}

contract ERC20WithMetadata is ERC20TokenMetadata {
    string private _tokenURI;

    constructor (string memory tokenURI) public {
        _tokenURI = tokenURI;
    }

    function tokenURI() external view returns (string memory) {
        return _tokenURI;
    }
}
