certoraRun \
    certora/harnesses/ERC1155/ERC1155SupplyHarness.sol \
    --verify ERC1155SupplyHarness:certora/specs/ERC1155Supply.spec \
    --solc solc8.2 \
    --optimistic_loop \
    --loop_iter 3 \
    --msg "ERC1155 Supply verification all rules"
