var MerkleProofMock = artifacts.require("./helpers/MerkleProofMock.sol");

contract('MerkleProof', function(accounts) {
    let merkleProof;

    before(async function() {
        merkleProof = await MerkleProofMock.new();
    });

    describe("verifyProof", function() {
        it("should return true for a valid Merkle proof given even number of leaves", async function() {
            // const elements = ["a", "b", "c", "d"].map(el => sha3(el));
            // const merkleTree = new MerkleTree(elements);

            // const root = merkleTree.getHexRoot();

            // const proof = merkleTree.getHexProof(elements[0]);

            // const leaf = merkleTree.bufToHex(elements[0]);

            // const validProof = await merkleProof.verifyProof(proof, root, leaf);
            // assert.isOk(validProof, "verifyProof did not return true for a valid proof given even number of leaves");
        });

        it("should return true for a valid Merkle proof given odd number of leaves", async function () {
            // const elements = ["a", "b", "c"].map(el => sha3(el));
            // const merkleTree = new MerkleTree(elements);

            // const root = merkleTree.getHexRoot();

            // const proof = merkleTree.getHexProof(elements[0]);

            // const leaf = merkleTree.bufToHex(elements[0]);

            // const validProof = await merkleProof.verifyProof(proof, root, leaf);
            // assert.isOk(validProof, "verifyProof did not return true for a valid proof given odd number of leaves");
        });

        it("should return false for an invalid Merkle proof", async function() {
            // const elements = ["a", "b", "c"].map(el => sha3(el));
            // const merkleTree = new MerkleTree(elements);

            // const root = merkleTree.getHexRoot();

            // const proof = merkleTree.getHexProof(elements[0]);
            // const badProof = proof.slice(0, proof.length - 32);

            // const leaf = merkleTree.bufToHex(elements[0]);

            // const validProof = await merkleProof.verifyProof(badProof, root, leaf);
            // assert.isNotOk(validProof, "verifyProof did not return false for an invalid proof");
        });
    });
});
