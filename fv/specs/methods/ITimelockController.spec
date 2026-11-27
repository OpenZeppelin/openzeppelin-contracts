methods {
    function _.PROPOSER_ROLE()                                                       external => DISPATCHER(true);
    function _.EXECUTOR_ROLE()                                                       external => DISPATCHER(true);
    function _.CANCELLER_ROLE()                                                      external => DISPATCHER(true);
    function _.isOperation(bytes32)                                                  external => DISPATCHER(true);
    function _.isOperationPending(bytes32)                                           external => DISPATCHER(true);
    function _.isOperationReady(bytes32)                                             external => DISPATCHER(true);
    function _.isOperationDone(bytes32)                                              external => DISPATCHER(true);
    function _.getTimestamp(bytes32)                                                 external => DISPATCHER(true);
    function _.getMinDelay()                                                         external => DISPATCHER(true);

    function _.hashOperation(address,uint256,bytes,bytes32,bytes32)                  external => DISPATCHER(true);
    function _.hashOperationBatch(address[],uint256[],bytes[],bytes32,bytes32)       external => DISPATCHER(true);

    function _.schedule(address,uint256,bytes,bytes32,bytes32,uint256)               external => DISPATCHER(true);
    function _.scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)    external => DISPATCHER(true);
    function _.execute(address,uint256,bytes,bytes32,bytes32)                        external => DISPATCHER(true);
    function _.executeBatch(address[],uint256[],bytes[],bytes32,bytes32)             external => DISPATCHER(true);
    function _.cancel(bytes32)                                                       external => DISPATCHER(true);
    function _.updateDelay(uint256)                                                  external => DISPATCHER(true);
}
