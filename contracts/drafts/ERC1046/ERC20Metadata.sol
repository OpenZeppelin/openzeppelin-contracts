pragma solidity ^0.5.0;

import "../../token/ERC20/IERC20.sol";

/**
 * @title ERC-1047 Token Metadata
 * @dev See https://eips.ethereum.org/EIPS/eip-1046
 * @dev {tokenURI} must respond with a URI that implements https://eips.ethereum.org/EIPS/eip-1047
 */
contract ERC20Metadata {
    string private _tokenURI;

    constructor (string memory tokenURI_) public {
        _setTokenURI(tokenURI_);
    }

    function tokenURI() external view returns (string memory) {
        return _tokenURI;
    }

    function _setTokenURI(string memory tokenURI_) internal {
        _tokenURI = tokenURI_;
    }
}
