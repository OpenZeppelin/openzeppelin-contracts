methods {
    isApprovedForAll(address, address) returns(bool) envfree
    balanceOf(address, uint256) returns(uint256) envfree
    balanceOfBatch(address[], uint256[]) returns(uint256[]) envfree
    _doSafeBatchTransferAcceptanceCheck(address, address, address, uint256[], uint256[], bytes) envfree
    _doSafeTransferAcceptanceCheck(address, address, address, uint256, uint256, bytes) envfree

    setApprovalForAll(address, bool)
    safeTransferFrom(address, address, uint256, uint256, bytes)
    safeBatchTransferFrom(address, address, uint256[], uint256[], bytes)
    _mint(address, uint256, uint256, bytes)
    _mintBatch(address, uint256[], uint256[], bytes)
    _burn(address, uint256, uint256)
    _burnBatch(address, uint256[], uint256[])
}



/////////////////////////////////////////////////
// Approval
/////////////////////////////////////////////////


// STATUS - verified
// Function $f, which is not setApprovalForAll, should not change approval
rule unexpectedAllowanceChange(method f, env e) filtered { f -> f.selector != setApprovalForAll(address, bool).selector } {
    address account; address operator;
    bool approveBefore = isApprovedForAll(account, operator); 

    calldataarg args;
    f(e, args);

    bool approveAfter = isApprovedForAll(account, operator);

    assert approveBefore == approveAfter, "You couldn't get king's approval this way!";
}   


// STATUS - verified
// approval can be changed only by owner
rule onlyOwnerCanApprove(env e){
    address owner; address operator; bool approved;

    bool aprovalBefore = isApprovedForAll(owner, operator);

    setApprovalForAll(e, operator, approved);

    bool aprovalAfter = isApprovedForAll(owner, operator);

    assert aprovalBefore != aprovalAfter => owner == e.msg.sender, "There should be only one owner";
}


// STATUS - verified
// chech in which scenarios (if any) isApprovedForAll() revertes
rule approvalRevertCases(env e){
    address account; address operator;
    isApprovedForAll@withrevert(account, operator);
    assert !lastReverted, "Houston, we have a problem";
}


// STATUS - verified 
// Set approval changes only one approval
rule onlyOneAllowanceChange(method f, env e) {
    address owner; address operator; address user; 
    bool approved;

    bool userApproveBefore = isApprovedForAll(owner, user);

    setApprovalForAll(e, operator, approved);

    bool userApproveAfter = isApprovedForAll(owner, user);

    assert userApproveBefore != userApproveAfter => (e.msg.sender == owner && operator == user), "Imposter!";
}   



/////////////////////////////////////////////////
// Balance
/////////////////////////////////////////////////


// STATUS - verified
// Function $f, which is not one of transfers, mints and burns, should not change balanceOf of a user
rule unexpectedBalanceChange(method f, env e) 
    filtered { f -> f.selector != safeTransferFrom(address, address, uint256, uint256, bytes).selector
                        && f.selector != safeBatchTransferFrom(address, address, uint256[], uint256[], bytes).selector 
                        && f.selector != _mint(address, uint256, uint256, bytes).selector 
                        && f.selector != _mintBatch(address, uint256[], uint256[], bytes).selector  
                        && f.selector != _burn(address, uint256, uint256).selector 
                        && f.selector != _burnBatch(address, uint256[], uint256[]).selector } {
    address from; uint256 id;
    uint256 balanceBefore = balanceOf(from, id);

    calldataarg args;
    f(e, args);

    uint256 balanceAfter = balanceOf(from, id);

    assert balanceBefore == balanceAfter, "How you dare to take my money?";
}   


// STATUS - verified
// chech in which scenarios balanceOf() revertes
rule balanceOfRevertCases(env e){
    address account; uint256 id;
    balanceOf@withrevert(account, id);
    assert lastReverted => account == 0, "Houston, we have a problem";
}


// STATUS - verified
// chech in which scenarios balanceOfBatch() revertes
rule balanceOfBatchRevertCases(env e){
    address[] accounts; uint256[] ids;
    address account1; address account2; address account3;
    uint256 id1; uint256 id2; uint256 id3;

    require accounts.length == 3; 
    require ids.length == 3; 

    require accounts[0] == account1; require accounts[1] == account2; require accounts[2] == account3;

    balanceOfBatch@withrevert(accounts, ids);
    assert lastReverted => (account1 == 0 || account2 == 0 || account3 == 0), "Houston, we have a problem";
}



/////////////////////////////////////////////////
// Transfer
/////////////////////////////////////////////////


// STATUS - 
// cannot transfer more than `from` balance (safeTransferFrom version)
rule cannotTransferMoreSingle(env e){
    address from; address to; uint256 id; uint256 amount; bytes data;
    uint256 balanceBefore = balanceOf(from, id);

    safeTransferFrom@withrevert(e, from, to, id, amount, data);

    assert amount > balanceBefore => lastReverted, "Achtung! Scammer!";
    assert to == 0 => lastReverted, "Achtung! Scammer!";
}


// STATUS - 
// cannot transfer more than allowed (safeBatchTransferFrom version)
rule cannotTransferMoreBatch(env e){
    address from; address to; uint256[] ids; uint256[] amounts; bytes data;
    uint256 idToCheck1; uint256 amountToCheck1;
    uint256 idToCheck2; uint256 amountToCheck2;
    uint256 idToCheck3; uint256 amountToCheck3;

    uint256 balanceBefore1 = balanceOf(from, idToCheck1);
    uint256 balanceBefore2 = balanceOf(from, idToCheck2);
    uint256 balanceBefore3 = balanceOf(from, idToCheck3);

    require ids.length == 3;        
    require amounts.length == 3;    
    require ids[0] == idToCheck1; require amounts[0] == amountToCheck1;
    require ids[1] == idToCheck2; require amounts[1] == amountToCheck2;
    require ids[2] == idToCheck3; require amounts[2] == amountToCheck3;

    safeBatchTransferFrom@withrevert(e, from, to, ids, amounts, data);

    assert (amountToCheck1 > balanceBefore1 || amountToCheck2 > balanceBefore2 || amountToCheck2 > balanceBefore2) => lastReverted, "Achtung! Scammer!";
}


// STATUS - (added debug vars)
// safeBatchTransferFrom should revert if `to` is 0 address or if arrays length is different
rule revertOfTransferBatch(env e){
    address from; address to; uint256[] ids; uint256[] amounts; bytes data;

    uint256 idTMP = ids.length;
    uint256 amountsTMP = amounts.length;

    safeBatchTransferFrom@withrevert(e, from, to, ids, amounts, data);

    assert ids.length != amounts.length => lastReverted, "Achtung! Scammer!";
    assert to == 0 => lastReverted, "Achtung! Scammer!";
}


// STATUS - verified
// Sender calling safeTransferFrom should only reduce 'from' balance and not other's if sending amount is greater than 0
rule transferBalanceReduceEffect(env e){
    address from; address to; address other;
    uint256 id; uint256 amount; 
    bytes data;

    require other != to;
    require amount > 0;

    uint256 otherBalanceBefore = balanceOf(other, id);

    safeTransferFrom(e, from, to, id, amount, data);

    uint256 otherBalanceAfter = balanceOf(other, id);

    assert from != other => otherBalanceBefore == otherBalanceAfter, "Don't touch my money!";
}


// STATUS - 
// Sender calling safeTransferFrom should only reduce 'to' balance and not other's if sending amount is greater than 0
rule transferBalanceIncreaseEffect(env e){
    address from; address to; address other;
    uint256 id; uint256 amount; 
    bytes data;

    require from != other;

    uint256 otherBalanceBefore = balanceOf(other, id);

    safeTransferFrom(e, from, to, id, amount, data);

    uint256 otherBalanceAfter = balanceOf(other, id);

    assert other != to => otherBalanceBefore == otherBalanceAfter, "Don't touch my money!";
}


// STATUS - 
// Sender calling safeTransferFrom should only reduce 'from' balance and not other's if sending amount is greater than 0
rule transferBatchBalanceFromEffect(env e){
    address from; address to; address other;
    uint256[] ids; uint256[] amounts;
    uint256 id1; uint256 amount1; uint256 id2; uint256 amount2; uint256 id3; uint256 amount3;
    bytes data;

    require other != to;

    // require ids.length == 3; 
    // require amounts.length == 3;
 
    // require ids[0] == id1; require ids[1] == id2; require ids[2] == id3;
    // require amounts[0] == amount1; require amounts[1] == amount2; require amounts[2] == amount3;
    // require amount1 > 0; require amount2 > 0; require amount3 > 0;

    uint256 otherBalanceBefore1 = balanceOf(other, id1);
    uint256 otherBalanceBefore2 = balanceOf(other, id2);
    uint256 otherBalanceBefore3 = balanceOf(other, id3);

    safeBatchTransferFrom(e, from, to, ids, amounts, data);

    uint256 otherBalanceAfter1 = balanceOf(other, id1);
    uint256 otherBalanceAfter2 = balanceOf(other, id2);
    uint256 otherBalanceAfter3 = balanceOf(other, id3);

    assert from != other => (otherBalanceBefore1 == otherBalanceAfter1 
                                && otherBalanceBefore2 == otherBalanceAfter2 
                                && otherBalanceBefore3 == otherBalanceAfter3), "Don't touch my money!";
}


// STATUS - 
// Sender calling safeBatchTransferFrom should only reduce 'to' balance and not other's if sending amount is greater than 0
rule transferBatchBalanceToEffect(env e){
    address from; address to; address other;
    uint256[] ids; uint256[] amounts;
    uint256 id1; uint256 amount1; uint256 id2; uint256 amount2; uint256 id3; uint256 amount3;
    bytes data;

    require other != from;

    // require ids.length == 3; 
    // require amounts.length == 3;
 
    // require ids[0] == id1; require ids[1] == id2; require ids[2] == id3;
    // require amounts[0] == amount1; require amounts[1] == amount2; require amounts[2] == amount3;
    // require amount1 > 0; require amount2 > 0; require amount3 > 0;

    uint256 otherBalanceBefore1 = balanceOf(other, id1);
    uint256 otherBalanceBefore2 = balanceOf(other, id2);
    uint256 otherBalanceBefore3 = balanceOf(other, id3);

    safeBatchTransferFrom(e, from, to, ids, amounts, data);

    uint256 otherBalanceAfter1 = balanceOf(other, id1);
    uint256 otherBalanceAfter2 = balanceOf(other, id2);
    uint256 otherBalanceAfter3 = balanceOf(other, id3);

    assert other != to => (otherBalanceBefore1 == otherBalanceAfter1 
                                && otherBalanceBefore2 == otherBalanceAfter2 
                                && otherBalanceBefore3 == otherBalanceAfter3), "Don't touch my money!";
}


// STATUS - verified
// cannot transfer without approval (safeTransferFrom version)
rule noTransferForNotApproved(env e) {
    address from; address operator;
    address to; uint256 id; uint256 amount; bytes data;

    require from != e.msg.sender;

    bool approve = isApprovedForAll(from, e.msg.sender);

    safeTransferFrom@withrevert(e, from, to, id, amount, data);

    assert !approve => lastReverted, "You don't have king's approval!";
}   


// STATUS - 
// cannot transfer without approval (safeBatchTransferFrom version)
rule noTransferBatchForNotApproved(env e) {
    address from; address operator; address to; 
    bytes data;
    uint256[] ids; uint256[] amounts;

    require from != e.msg.sender;

    bool approve = isApprovedForAll(from, e.msg.sender);

    safeBatchTransferFrom@withrevert(e, from, to, ids, amounts, data);

    assert !approve => lastReverted, "You don't have king's approval!";
}   


// STATUS - 
// safeTransferFrom doesn't affect any approval
rule noTransferEffectOnApproval(env e){
    address from; address to;
    address owner; address operator;
    uint256 id; uint256 amount; 
    bytes data;

    bool approveBefore = isApprovedForAll(owner, operator);

    safeTransferFrom(e, from, to, id, amount, data);

    bool approveAfter = isApprovedForAll(owner, operator);

    assert approveBefore == approveAfter, "Something was effected";
}


// STATUS - 
// safeTransferFrom doesn't affect any approval
rule noTransferBatchEffectOnApproval(env e){
    address from; address to;
    address owner; address operator;
    uint256[] ids; uint256[] amounts;
    bytes data;

    bool approveBefore = isApprovedForAll(owner, operator);

    safeBatchTransferFrom(e, from, to, ids, amounts, data);

    bool approveAfter = isApprovedForAll(owner, operator);

    assert approveBefore == approveAfter, "Something was effected";
}


/////////////////////////////////////////////////
// Mint
/////////////////////////////////////////////////


// STATUS - verified
// the user cannot mint more than max_uint256
rule cantMintMoreSingle(env e){
    address to; uint256 id; uint256 amount; bytes data;

    require to_mathint(balanceOf(to, id) + amount) > max_uint256;

    _mint@withrevert(e, to, id, amount, data);
    
    assert lastReverted, "Don't be too greedy!";
}


// STATUS - verified
// the user cannot mint more than max_uint256 (batch version)
rule cantMintMoreBatch(env e){
    address to; bytes data;
    uint256 id1; uint256 id2; uint256 id3; 
    uint256 amount1; uint256 amount2; uint256 amount3;
    uint256[] ids; uint256[] amounts;

    require ids.length == 3; 
    require amounts.length == 3;

    require ids[0] == id1; require ids[1] == id2; require ids[2] == id3;
    require amounts[0] == amount1; require amounts[1] == amount2; require amounts[2] == amount3;

    require to_mathint(balanceOf(to, id1) + amount1) > max_uint256 
                || to_mathint(balanceOf(to, id2) + amount2) > max_uint256
                || to_mathint(balanceOf(to, id3) + amount3) > max_uint256;

    _mintBatch@withrevert(e, to, ids, amounts, data);
    
    assert lastReverted, "Don't be too greedy!";
}


// rule mintRevert(env e){
//     address operator;
//     address from;
//     address to;
//     uint256 id;
//     uint256 amount;
//     bytes data;
// 
//     require operator == e.msg.sender;
//     require from == 0;
// 
//     _doSafeTransferAcceptanceCheck@withrevert(operator, from, to, id, amount, data);
// 
//     bool acceptanceCheck = lastReverted;
// 
//     _mint@withrevert(e, to, id, amount, data);
// 
//     bool mintRevert = lastReverted;
// 
//     assert acceptanceCheck => mintRevert, "reverts are wrong";
// }



/////////////////////////////////////////////////
// Burn
/////////////////////////////////////////////////


// STATUS - 
// check that burn updates `from` balance correctly
rule burnCorrectWork(env e){
    address from; uint256 id; uint256 amount;

    uint256 otherBalanceBefore = balanceOf(from, id);

    _burn(e, from, id, amount);

    uint256 otherBalanceAfter = balanceOf(from, id);
    
    assert otherBalanceBefore == otherBalanceAfter + amount, "Something is wrong";
}


// STATUS - 
// check that burnBatch updates `from` balance correctly
rule burnBatchCorrectWork(env e){
    address from;
    uint256 id1; uint256 id2; uint256 id3; 
    uint256 amount1; uint256 amount2; uint256 amount3;
    uint256[] ids; uint256[] amounts;

    require ids.length == 3; 
    require amounts.length == 3;

    require id1 != id2 && id2 != id3 && id3 != id1;
    require ids[0] == id1; require ids[1] == id2; require ids[2] == id3;
    require amounts[0] == amount1; require amounts[1] == amount2; require amounts[2] == amount3;

    uint256 otherBalanceBefore1 = balanceOf(from, id1);
    uint256 otherBalanceBefore2 = balanceOf(from, id2);
    uint256 otherBalanceBefore3 = balanceOf(from, id3);

    _burnBatch(e, from, ids, amounts);

    uint256 otherBalanceAfter1 = balanceOf(from, id1);
    uint256 otherBalanceAfter2 = balanceOf(from, id2);
    uint256 otherBalanceAfter3 = balanceOf(from, id3);
    
    assert otherBalanceBefore1 == otherBalanceAfter1 + amount1
            && otherBalanceBefore2 == otherBalanceAfter2 + amount2
            && otherBalanceBefore3 == otherBalanceAfter3 + amount3
            , "Something is wrong";
}


// STATUS - verified
// the user cannot mint more than max_uint256
rule cantBurnMoreSingle(env e){
    address from; uint256 id; uint256 amount;

    require to_mathint(balanceOf(from, id) - amount) < 0;

    _burn@withrevert(e, from, id, amount);
    
    assert lastReverted, "Don't be too greedy!";
}


// STATUS - 
// burn changes only `from` balance
rule cantBurnOtherBalances(env e){
    address from; uint256 id; uint256 amount;
    address other;

    uint256 otherBalanceBefore = balanceOf(other, id);

    _burn(e, from, id, amount);

    uint256 otherBalanceAfter = balanceOf(other, id);
    
    assert other != from => otherBalanceBefore == otherBalanceAfter, "I like to see your money disappearing";
}


// STATUS - verified
// the user cannot mint more than max_uint256 (batch version)
rule cantBurnMoreBatch(env e){
    address from;
    uint256 id1; uint256 id2; uint256 id3; 
    uint256 amount1; uint256 amount2; uint256 amount3;
    uint256[] ids; uint256[] amounts;

    require ids.length == 3; 

    require ids[0] == id1; require ids[1] == id2; require ids[2] == id3;
    require amounts[0] == amount1; require amounts[1] == amount2; require amounts[2] == amount3;

    require to_mathint(balanceOf(from, id1) - amount1) < 0 
                || to_mathint(balanceOf(from, id2) - amount2) < 0 
                || to_mathint(balanceOf(from, id3) - amount3) < 0 ;

    _burnBatch@withrevert(e, from, ids, amounts);
    
    assert lastReverted, "Don't be too greedy!";
}


// STATUS - 
// burnBatch changes only `from` balance
rule cantBurnbatchOtherBalances(env e){
    address from;
    uint256 id1; uint256 id2; uint256 id3; 
    uint256 amount1; uint256 amount2; uint256 amount3;
    uint256[] ids; uint256[] amounts;
    address other;

    require ids.length == 3; 
    require amounts.length == 3;

    require ids[0] == id1; require ids[1] == id2; require ids[2] == id3;
    require amounts[0] == amount1; require amounts[1] == amount2; require amounts[2] == amount3;

    uint256 otherBalanceBefore1 = balanceOf(other, id1);
    uint256 otherBalanceBefore2 = balanceOf(other, id2);
    uint256 otherBalanceBefore3 = balanceOf(other, id3);

    _burnBatch(e, from, ids, amounts);

    uint256 otherBalanceAfter1 = balanceOf(other, id1);
    uint256 otherBalanceAfter2 = balanceOf(other, id2);
    uint256 otherBalanceAfter3 = balanceOf(other, id3);
    
    assert other != from => (otherBalanceBefore1 == otherBalanceAfter1 
                                || otherBalanceBefore2 == otherBalanceAfter2 
                                || otherBalanceBefore3 == otherBalanceAfter3)
                                , "I like to see your money disappearing";
}
