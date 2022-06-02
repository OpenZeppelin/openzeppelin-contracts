make -C certora munged

certoraRun \
    certora/harnesses/ERC1155/ERC1155BurnableHarness.sol \
    --verify ERC1155BurnableHarness:certora/specs/ERC1155Burnable.spec \
    --solc solc8.2 \
    --optimistic_loop \
    --loop_iter 3 \
    --send_only \
    --cloud \
    --msg "ERC1155 Burnable verification all rules"
    