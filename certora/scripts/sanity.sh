make -C certora munged

for f in certora/harnesses/Wizard*.sol
do
    echo "Processing $f"
    file=$(basename $f)
    echo ${file%.*}
    certoraRun certora/harnesses/$file \
    --verify ${file%.*}:certora/specs/sanity.spec "$@" \
    --solc solc8.2 --staging shelly/forSasha \
    --optimistic_loop \
    --msg "checking sanity on ${file%.*}"
    --settings -copyLoopUnroll=4
done
