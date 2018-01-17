pragma solidity ^0.4.18;

import "./OperatableERC721.sol";
import "./DetailedERC721Token.sol";

/**
 * @title Operatable ERC721 Token
 * Extended implementation of the ERC721 standard including approveAll and transfer&call functionalities
 * Inspired by Decentraland's and Dharma's implementation
 */
contract OperatableERC721Token is OperatableERC721, DetailedERC721Token {

  // Mapping from owner to operator approvals
  mapping (address => mapping (address => bool)) private operatorApprovals;

  /**
  * @dev Sets the approval of a given operator
  * @param _to operator address to set the approval
  * @param _approved representing the status of the approval to be set
  */
  function setOperatorApproval(address _to, bool _approved) public {
    require(_to != msg.sender);
    operatorApprovals[msg.sender][_to] = _approved;
  }

  /**
   * @dev Tells whether an operator is approved by a given owner
   * @param _owner owner address which you want to query the approval of
   * @param _operator operator address which you want to query the approval of
   * @return bool whether the given operator is approved by the given owner
   */
  function isOperatorApprovedFor(address _owner, address _operator) public view returns (bool) {
    return operatorApprovals[_owner][_operator];
  }

  /**
   * @dev Transfer the ownership of a given token ID to another contract address and calls it with given data
   * @param _to address to receive the ownership of the given token ID
   * @param _tokenId uint256 ID of the token to be transferred
   * @param _data bytes of data to be sent when the receiving address gets called
   */
  function transfer(address _to, uint _tokenId, bytes _data) public onlyOwnerOf(_tokenId) {
    clearApprovalAndTransfer(msg.sender, _to, _tokenId);
    require(_to.call(_data));
  }

  /**
  * @dev Claims the ownership of a given token ID for a given recipient
  * @param _to address which you want to transfer the token to
  * @param _tokenId uint256 ID of the token being claimed by the msg.sender
  */
  function takeOwnershipFor(address _to, uint256 _tokenId) public {
    require(isApprovedFor(_tokenId));
    clearApprovalAndTransfer(ownerOf(_tokenId), _to, _tokenId);
  }

  /**
   * @dev Tells whether the msg.sender is approved for the given token ID or
   * if he is an operator approved by the owner of the token
   * @param _tokenId uint256 ID of the token to query the approval of
   * @return bool whether the msg.sender is approved for the given token ID or not
   */
  function isApprovedFor(uint256 _tokenId) internal view returns (bool) {
    return super.isApprovedFor(_tokenId) || isOperatorApprovedFor(ownerOf(_tokenId), msg.sender);
  }
}
