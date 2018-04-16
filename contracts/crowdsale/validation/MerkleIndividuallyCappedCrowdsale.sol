pragma solidity ^0.4.21;

import { MerkleProof } from "../../MerkleProof.sol";
import "../../math/SafeMath.sol";
import "../../ownership/Ownable.sol";
import "../Crowdsale.sol";


/**
 * @title MerkleIndividuallyCappedCrowdsale
 * @dev Crowdsale with per-user caps stored as Merkle tree.
 */
contract MerkleIndividuallyCappedCrowdsale is Crowdsale, Ownable {
  mapping(address => uint256) public contributions;
  bytes32 public capsMerkleRoot;

  /**
   * @dev Sets a overall users maximum contributions
   * @param _capsMerkleRoot Root of the merkle tree
   */
  function setCapsMerkleRoot(bytes32 _capsMerkleRoot) public onlyOwner {
    capsMerkleRoot = _capsMerkleRoot;
  }

  /**
   * @dev Override parent behavior to deny this method usage
   * @param _beneficiary Token purchaser
   */
  function buyTokens(address _beneficiary) public payable {
    revert();
  }

  /**
   * @dev Extend parent behavior to update user contributions
   * @param _beneficiary Token purchaser
   * @param _individualCap Beneficiary personal cap in wei
   * @param _proof Merkle proof of personal cap
   */
  function buyTokens(address _beneficiary, uint256 _individualCap, bytes32[] _proof) public payable {
    require(contributions[_beneficiary] + msg.value <= _individualCap);
    bytes32 leaf = keccak256(_beneficiary, _individualCap);
    require(MerkleProof.verifyProof(_proof, capsMerkleRoot, leaf));
    
    contributions[_beneficiary] += msg.value;
    super.buyTokens(_beneficiary);
  }

}
