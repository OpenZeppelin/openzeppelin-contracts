pragma solidity ^0.4.0;

import "../Rejector.sol";

/*
 * Proof of Existence example contract
 * see https://medium.com/zeppelin-blog/the-hitchhikers-guide-to-smart-contracts-in-ethereum-848f08001f05
 */
contract ProofOfExistence is Rejector {

  mapping (bytes32 => bool) public proofs;

  // store a proof of existence in the contract state
  function storeProof(bytes32 proof) {
    proofs[proof] = true;
  }

  // calculate and store the proof for a document
  function notarize(string document) {
    var proof = calculateProof(document);
    storeProof(proof);
  }

  // helper function to get a document's sha256
  function calculateProof(string document) constant returns (bytes32) {
    return sha256(document);
  }

  // check if a document has been notarized
  function checkDocument(string document) constant returns (bool) {
    var proof = calculateProof(document);
    return hasProof(proof);
  }

  // returns true if proof is stored
  function hasProof(bytes32 proof) constant returns (bool) {
    return proofs[proof];
  }
}
