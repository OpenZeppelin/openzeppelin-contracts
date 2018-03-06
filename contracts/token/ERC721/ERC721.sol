pragma solidity ^0.4.18;

import "./BaseERC721.sol";


/**
 * @title Full ERC721 interface
 * @dev see https://github.com/ethereum/eips/issues/721 and https://github.com/ethereum/EIPs/pull/841
 */
contract ERC721 is BaseERC721 {
  event OperatorApproval(address indexed _owner, address indexed _operator, bool _approved);

  function name() public view returns (string _name);
  function symbol() public view returns (string _symbol);
  function takeOwnershipFor(address _to, uint256 _tokenId) public;
  function setOperatorApproval(address _to, bool _approved) public;
  function isOperatorApprovedFor(address _owner, address _operator) public view returns (bool);
  function tokenOfOwnerByIndex(address _owner, uint256 _index) public view returns (uint256 _tokenId);
}
