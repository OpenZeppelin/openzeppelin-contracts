pragma solidity ^0.4.18;

import "./ERC721.sol";
import "./BaseERC721Token.sol";


/**
 * @title Full ERC721 Token
 * This implementation includes all the required and some optional functionality of the ERC721 standard
 * Moreover, it includes approve all functionality using operatable terminology
 * @dev see https://github.com/ethereum/eips/issues/721 and https://github.com/ethereum/EIPs/pull/841
 */
contract ERC721Token is ERC721, BaseERC721Token {
  // Token name
  string private _name;

  // Token symbol
  string private _symbol;

  // Mapping from owner to operator approvals
  mapping (address => mapping (address => bool)) private operatorApprovals;

  /**
  * @dev Constructor function
  */
  function ERC721Token(string name, string symbol) public {
    _name = name;
    _symbol = symbol;
  }

  /**
  * @dev Gets the token name
  * @return string representing the token name
  */
  function name() public view returns (string) {
    return _name;
  }

  /**
  * @dev Gets the token symbol
  * @return string representing the token symbol
  */
  function symbol() public view returns (string) {
    return _symbol;
  }

  /**
  * @dev Gets the token ID at a given index of the tokens list of the requested owner
  * @param _owner address owning the tokens list to be accessed
  * @param _index uint256 representing the index to be accessed of the requested tokens list
  * @return uint256 token ID at the given index of the tokens list owned by the requested address
  */
  function tokenOfOwnerByIndex(address _owner, uint256 _index) public view returns (uint256) {
    require(_index < balanceOf(_owner));
    return tokensOf(_owner)[_index];
  }

  /**
  * @dev Claims the ownership of a given token ID for a given recipient
  * @param _to address which you want to transfer the token to
  * @param _tokenId uint256 ID of the token being claimed by the msg.sender
  */
  function takeOwnershipFor(address _to, uint256 _tokenId) public {
    require(isApprovedFor(msg.sender, _tokenId));
    clearApprovalAndTransfer(ownerOf(_tokenId), _to, _tokenId);
  }

  /**
  * @dev Sets the approval of a given operator
  * @param _to operator address to set the approval
  * @param _approved representing the status of the approval to be set
  */
  function setOperatorApproval(address _to, bool _approved) public {
    require(_to != msg.sender);
    operatorApprovals[msg.sender][_to] = _approved;
    OperatorApproval(msg.sender, _to, _approved);
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
   * @dev Tells whether the given spender is approved for the given token ID or
   * if the given owner is an operator approved by the owner of the token
   * @param _spender address of the spender to query the approval of
   * @param _tokenId uint256 ID of the token to query the approval of
   * @return bool whether the msg.sender is approved for the given token ID or not
   */
  function isApprovedFor(address _spender, uint256 _tokenId) internal view returns (bool) {
    return super.isApprovedFor(_spender, _tokenId) || isOperatorApprovedFor(ownerOf(_tokenId), _spender);
  }
}
