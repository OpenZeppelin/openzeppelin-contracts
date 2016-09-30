// Proof of Existence contract, version 3
contract ProofOfExistence3 {

  mapping (bytes32 => bool) proofs;

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
  function calculateProof(string document) returns (bytes32) {
    return sha256(document);
  }

  // check if a document has been notarized
  function checkDocument(string document) returns (bool) {
    var proof = calculateProof(document);
    return hasProof(proof);
  }

  // returns true if proof is stored
  function hasProof(bytes32 proof) returns (bool) {
    return proofs[proof];
  }
}
