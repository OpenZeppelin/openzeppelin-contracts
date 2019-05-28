pragma solidity ^0.5.2;

import "zos-lib/contracts/Initializable.sol";
import "../../token/ERC20/IERC20.sol";

/**
 * @title ERC-1047 Token Metadata
 * @dev See https://eips.ethereum.org/EIPS/eip-1046
 * @dev tokenURI must respond with a URI that implements https://eips.ethereum.org/EIPS/eip-1047
 */
contract ERC20Metadata is Initializable {
    string private _tokenURI;

    function initialize(string memory tokenURI_) public {
        _setTokenURI(tokenURI_);
    }

    function tokenURI() external view returns (string memory) {
        return _tokenURI;
    }

    function _setTokenURI(string memory tokenURI_) internal {
        _tokenURI = tokenURI_;
    }

    uint256[50] private ______gap;
}
