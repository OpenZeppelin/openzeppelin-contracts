certoraRun \
    certora/munged/token/ERC1155/ERC1155.sol \
    --verify ERC1155:certora/specs/ERC1155.spec \
    --solc solc8.2 \
    --optimistic_loop \
    --loop_iter 3 \
    --staging \
    --rule_sanity \
    --rule "$1" \
    --msg "$1 check"
    