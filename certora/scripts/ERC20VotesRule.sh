if [ -z "$2" ]
  then
    echo "Incorrect number of arguments"
    echo ""
    echo "Usage: (from git root)"
    echo "  ./certora/scripts/`basename $0` [message describing the run] [rule or invariant]"
    echo ""
    exit 1
fi

rule=$1
msg=$2
shift 2

certoraRun \
    certora/harnesses/ERC20VotesHarness.sol \
    --verify ERC20VotesHarness:certora/specs/ERC20Votes.spec \
    --solc solc8.2 \
    --optimistic_loop \
    --rule ${rule} \
    --msg "${msg}" \
    --staging "alex/new-dt-hashing-alpha" \
    --rule_sanity \