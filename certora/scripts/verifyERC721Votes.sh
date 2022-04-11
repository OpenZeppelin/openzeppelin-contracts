make -C certora munged

if [ -z "$1" ]
  then
    echo "Incorrect number of arguments"
    echo ""
    echo "Usage: (from git root)"
    echo "  ./certora/scripts/`basename $0` [message describing the run]"
    echo ""
    exit 1
fi

msg=$1
shift 1

certoraRun \
    certora/harnesses/ERC721VotesHarness.sol \
    certora/munged/utils/Checkpoints.sol \
    --verify ERC721VotesHarness:certora/specs/ERC721Votes.spec \
    --solc solc8.2 \
    --optimistic_loop \
    --loop_iter 4 \
    --staging "alex/new-dt-hashing-alpha" \
    --msg "${msg}" \
    # --rule_sanity