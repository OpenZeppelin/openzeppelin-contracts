pragma solidity ^0.4.21;

import "../../token/ERC20/ERC20.sol";

/**
 * @title ERC-1047 Token Metadata
 * @dev See https://eips.ethereum.org/EIPS/eip-1046
 * @dev tokenURI must respond with a URI that implements https://eips.ethereum.org/EIPS/eip-1047
 * @dev TODO - update https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC721/ERC721.sol#L17 when 1046 is finalized
 */
contract ERC20TokenMetadata is ERC20 {
  function tokenURI() public view returns (string);
}

contract ERC20WithMetadata is ERC20TokenMetadata {
  string private tokenURI_ = "";

  function ERC20WithMetadata(string _tokenURI)
    public
  {
    tokenURI_ = _tokenURI;
  }

  function tokenURI() public view returns (string) {
    // in the effort of minimum-effort compatibility,
    //   tokenURI MUST throw if not exists https://eips.ethereum.org/EIPS/eip-721
    bytes memory _tokenURI = bytes(tokenURI_);
    require(_tokenURI.length > 0);

    return tokenURI_;
  }
}
