#!/bin/bash

for receipt in $(cat certora/matrix.json | jq -r ".[$1] | @base64")
do
    FILE=$(echo $receipt | base64 --decode | jq -r '.file')
    NAME=$(echo $receipt | base64 --decode | jq -r '.name')
    SPEC=$(echo $receipt | base64 --decode | jq -r '.spec')
    ARGS=$(echo $receipt | base64 --decode | jq -r '.args//""')
    DISABLED=$(echo $receipt | base64 --decode | jq -r '.disabled//false')


    echo "Running $SPEC on $FILE:$NAME ..."
    if [[ $DISABLED == 'true' ]];
    then
        echo "disabled"
    else
        certoraRun $FILE --verify $NAME:$SPEC --solc solc --optimistic_loop --loop_iter 3 $ARGS --cloud
    fi
done

# [00] ERC1155.spec                   -- pass
# [01] ERC1155Burnable.spec           -- pass
# [02] ERC1155Pausable.spec           -- pass
# [03] ERC1155Supply.spec             -- pass
# [04] GovernorPreventLateQuorum.spec -- nope
# [05] Initializable.spec             -- nope