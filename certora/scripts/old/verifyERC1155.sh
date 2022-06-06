certoraRun \
    certora/harnesses/ERC1155/ERC1155Harness.sol \
    --verify ERC1155Harness:certora/specs/ERC1155.spec \
    --solc solc \
    --optimistic_loop \
    --loop_iter 3 \
    --send_only \
    --msg "ERC1155"
    