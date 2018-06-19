pragma solidity ^0.4.21;

import { MerkleProof } from "../../MerkleProof.sol";
import "../../math/SafeMath.sol";
import "./IndividuallyCappedCrowdsale.sol";


/**
 * @title MerkleIndividuallyCappedCrowdsale
 * @dev Crowdsale with per-user caps stored as Merkle tree.
 */
contract MerkleIndividuallyCappedCrowdsale is IndividuallyCappedCrowdsale {
  bytes32 public capsMerkleRoot;

  /**
   * @dev Sets a overall users maximum contributions
   * @param _capsMerkleRoot Root of the merkle tree
   */
  function setCapsMerkleRoot(bytes32 _capsMerkleRoot) public onlyOwner {
    capsMerkleRoot = _capsMerkleRoot;
  }

  /**
   * @dev Sets a specific user's maximum contribution.
   * @param _beneficiary Address to be capped
   * @param _cap Wei limit for individual contribution
   * @param _proof Merkle tree proof up to capsMerkleRoot
   */
  function setUserCap(address _beneficiary, uint256 _cap, bytes32[] _proof) external {
    require(contributions[_beneficiary] + msg.value <= _cap);
    bytes32 leaf = keccak256(_beneficiary, _cap);
    require(MerkleProof.verifyProof(_proof, capsMerkleRoot, leaf));
    caps[_beneficiary] = _cap;
  }

  /**
   * @dev Sets a group of users' maximum contribution.
   * @param _beneficiaries List of addresses to be capped
   * @param _cap Wei limit for individual contribution
   */
  function setGroupCap(address[] _beneficiaries, uint256 _cap) external {
    revert();
  }

  /**
   * @dev Sets a specific user's maximum contribution an buy tokens in the same transaction
   * @param _beneficiary Address to be capped
   * @param _cap Wei limit for individual contribution
   */
  function setUserCapAndBuyTokens(address _beneficiary, uint256 _cap, bytes32[] _proof) external payable {
    this.setUserCap(_beneficiary, _cap, _proof);
    buyTokens(_beneficiary);
  }

}
