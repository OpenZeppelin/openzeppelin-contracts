MerkleProof
=============================================

Merkle proof verification for leaves of a Merkle tree.

verifyProof(bytes _proof, bytes32 _root, bytes32 _leaf) internal constant returns (bool)
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

Verifies a Merkle proof proving the existence of a leaf in a Merkle tree. Assumes that each pair of leaves and each pair of pre-images is sorted.
