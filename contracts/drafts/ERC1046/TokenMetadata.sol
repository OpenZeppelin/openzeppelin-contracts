pragma solidity ^0.4.24;

import "../../token/ERC20/IERC20.sol";


/**
 * @title ERC-1047 Token Metadata
 * @dev See https://eips.ethereum.org/EIPS/eip-1046
 * @dev tokenURI must respond with a URI that implements https://eips.ethereum.org/EIPS/eip-1047
 * @dev TODO - update https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC721/IERC721.sol#L17 when 1046 is finalized
 */
contract ERC20TokenMetadata is IERC20 {
  function tokenURI() external view returns (string);
}


contract ERC20WithMetadata is ERC20TokenMetadata {
  string private _tokenURI = "";

  constructor(string tokenURI)
    public
  {
    _tokenURI = tokenURI;
  }

  function tokenURI() external view returns (string) {
    return _tokenURI;
  }
}
