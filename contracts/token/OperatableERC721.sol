pragma solidity ^0.4.18;

import "./DetailedERC721.sol";

/**
 * @title ERC721 interface
 * @dev see https://github.com/ethereum/eips/issues/721
 */
contract OperatableERC721 is DetailedERC721 {
  function setOperatorApproval(address _to, bool _approved) public;
  function isOperatorApprovedFor(address _owner, address _operator) public view returns (bool);
  function transfer(address _to, uint _tokenId, bytes _data) public;
  function takeOwnershipFor(address _to, uint256 _tokenId) public;
}
