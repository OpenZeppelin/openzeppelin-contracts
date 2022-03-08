methods {
    // hashOperation(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) returns(bytes32) => uniqueHashGhost(target, value, data, predecessor, salt)
}

// ghost uniqueHashGhost(address, uint256, bytes, bytes32, bytes32) returns bytes32;
//
// Assuming the hash is deterministic, and correlates the trio properly
// function hashUniquness(address target1, uint256 value1, bytes data1, bytes32 predecessor1, bytes32 salt1, 
//                             address target2, uint256 value2, bytes data2, bytes32 predecessor2, bytes32 salt2){
//     require ((target1 != target2) || (value1 != value2) || (data1 != data2) || (predecessor1 != predecessor2) || (salt1 != salt2)) <=> 
//     (uniqueHashGhost(target1, value1, data1, predecessor1, salt1) != uniqueHashGhost(target2, value2, data2, predecessor2, salt2));
// }
// 
// 
// rule keccakCheck(method f, env e){
//     address target;
//     uint256 value;
//     bytes data;
//     bytes32 predecessor;
//     bytes32 salt;
// 
//     hashUniquness(target, value, data, predecessor, salt, 
//                          target, value, data, predecessor, salt);
// 
//     bytes32 a = hashOperation(e, target, value, data, predecessor, salt);
//     bytes32 b = hashOperation(e, target, value, data, predecessor, salt);
// 
//     assert a == b, "hashes are different";
// }

rule sanity(method f) {
    env e;
    calldataarg arg;
    f(e, arg);
    assert false;
}