for f in certora/harnesses/*.sol
do
    echo "Processing $f"
    file=$(basename $f)
    echo ${file%.*}
    certoraRun certora/harnesses/$file \
    --verify ${file%.*}:certora/specs/sanity.spec "$@" \
    --solc solc8.0 --staging \
    --optimistic_loop \
    --msg "checking sanity on ${file%.*}"
    --settings -copyLoopUnroll=4
done