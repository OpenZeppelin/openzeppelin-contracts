certoraRun \
    certora/harnesses/ERC721VotesHarness.sol \
    certora/munged/utils/Checkpoints.sol \
    --verify ERC721VotesHarness:certora/specs/ERC721Votes.spec \
    --solc solc8.2 \
    --disableLocalTypeChecking \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --cloud \
    --send_only \
    --msg "ERC721Votes"

    # --staging "alex/new-dt-hashing-alpha" \

