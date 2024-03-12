pragma solidity ^0.8.20;

import {MerkleProof} from "../../../openzeppelin-contracts/contracts/utils/cryptography/MerkleProof.sol";

contract MyMerkProof {

    /*
        [
            0x0000000000000000000000000000000000000000000000000000000000000001,(left)
            0x0000000000000000000000000000000000000000000000000000000000000002 (right)
        ]
        0xe90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0(root)
    */

    function verify() public returns(bool) {
        bytes32[] memory _proof = new bytes32[](1);
        _proof[0] = 0x0000000000000000000000000000000000000000000000000000000000000001;

        bytes32 root = 0xe90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0;
        bytes32 leaf = 0x0000000000000000000000000000000000000000000000000000000000000002;

        return MerkleProof.verify(_proof, root, leaf);
    }
}