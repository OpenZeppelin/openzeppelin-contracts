echo "Usage: Contract Spec"
echo "e.g. GovernorVotes Privileged"
Contract=$1
Spec=$2
shift 2
certoraRun certora/harnesses/${Contract}Harness.sol \
    --verify ${Contract}Harness:certora/specs/${Spec}.spec "$@" \
    --solc solc8.0 --staging --rule noBothExecutedAndCanceled
    