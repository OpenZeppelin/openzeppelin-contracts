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
// Approval (4/4)
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
// Chech that isApprovedForAll() revertes in planned scenarios and no more. 
rule approvalRevertCases(env e){
    address account; address operator;
    isApprovedForAll@withrevert(account, operator);
    assert !lastReverted, "Houston, we have a problem";
}


// STATUS - verified
// setApproval changes only one approval
rule onlyOneAllowanceChange(method f, env e) {
    address owner; address operator; address user; 
    bool approved;

    bool userApproveBefore = isApprovedForAll(owner, user);

    setApprovalForAll(e, operator, approved);

    bool userApproveAfter = isApprovedForAll(owner, user);

    assert userApproveBefore != userApproveAfter => (e.msg.sender == owner && operator == user), "Imposter!";
}   



/////////////////////////////////////////////////
// Balance (3/3)
/////////////////////////////////////////////////


// STATUS - verified
// Function $f, which is not one of transfers, mints and burns, should not change balanceOf of a user
rule unexpectedBalanceChange(method f, env e) 
    filtered { f -> f.selector != safeTransferFrom(address, address, uint256, uint256, bytes).selector
                        && f.selector != safeBatchTransferFrom(address, address, uint256[], uint256[], bytes).selector 
                        && f.selector != _mint(address, uint256, uint256, bytes).selector 
                        && f.selector != _mintBatch(address, uint256[], uint256[], bytes).selector  
                        && f.selector != _burn(address, uint256, uint256).selector 
                        && f.selector != _burnBatch(address, uint256[], uint256[]).selector 
                        && f.selector != burn(address, uint256, uint256).selector 
                        && f.selector != burnBatch(address, uint256[], uint256[]).selector } {
    address from; uint256 id;
    uint256 balanceBefore = balanceOf(from, id);

    calldataarg args;
    f(e, args);

    uint256 balanceAfter = balanceOf(from, id);

    assert balanceBefore == balanceAfter, "How you dare to take my money?";
}   


// STATUS - verified
// Chech that `balanceOf()` revertes in planned scenarios and no more (only if `account` is 0)
rule balanceOfRevertCases(env e){
    address account; uint256 id;
    balanceOf@withrevert(account, id);
    assert lastReverted => account == 0, "Houston, we have a problem";
}


// STATUS - verified
// Chech that `balanceOfBatch()` revertes in planned scenarios and no more (only if at least one of `account`s is 0)
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
// Transfer (13/13)
/////////////////////////////////////////////////


// STATUS - verified
// transfer additivity
rule transferAdditivity(env e){
    address from; address to; uint256 id; bytes data;
    uint256 amount; uint256 amount1; uint256 amount2;
    require amount == amount1 + amount2;

    storage initialStorage = lastStorage;

    safeTransferFrom(e, from, to, id, amount, data);

    uint256 balanceAfterSingleTransaction = balanceOf(to, id);

    safeTransferFrom(e, from, to, id, amount1, data) at initialStorage;
    safeTransferFrom(e, from, to, id, amount2, data);

    uint256 balanceAfterDoubleTransaction = balanceOf(to, id);

    assert balanceAfterSingleTransaction == balanceAfterDoubleTransaction, "Not additive";
}


// STATUS - verified
// safeTransferFrom updates `from` and `to` balances
rule transferCorrectness(env e){
    address from; address to; uint256 id; uint256 amount; bytes data;

    require to != from;

    uint256 fromBalanceBefore = balanceOf(from, id);
    uint256 toBalanceBefore = balanceOf(to, id);

    safeTransferFrom(e, from, to, id, amount, data);

    uint256 fromBalanceAfter = balanceOf(from, id);
    uint256 toBalanceAfter = balanceOf(to, id);

    assert fromBalanceBefore == fromBalanceAfter + amount, "Something wet wrong";
    assert toBalanceBefore == toBalanceAfter - amount, "Something wet wrong";
}


// STATUS - verified
// safeBatchTransferFrom updates `from` and `to` balances)
rule transferBatchCorrectness(env e){
    address from; address to; uint256[] ids; uint256[] amounts; bytes data;
    uint256 idToCheck1; uint256 amountToCheck1;
    uint256 idToCheck2; uint256 amountToCheck2;
    uint256 idToCheck3; uint256 amountToCheck3;

    require to != from;
    require idToCheck1 != idToCheck2 && idToCheck3 != idToCheck2 && idToCheck1 != idToCheck3;
    
    require ids.length == 3;        
    require amounts.length == 3;    
    require ids[0] == idToCheck1; require amounts[0] == amountToCheck1;
    require ids[1] == idToCheck2; require amounts[1] == amountToCheck2;
    require ids[2] == idToCheck3; require amounts[2] == amountToCheck3;

    uint256 fromBalanceBefore1 = balanceOf(from, idToCheck1);
    uint256 fromBalanceBefore2 = balanceOf(from, idToCheck2);
    uint256 fromBalanceBefore3 = balanceOf(from, idToCheck3);

    uint256 toBalanceBefore1 = balanceOf(to, idToCheck1);
    uint256 toBalanceBefore2 = balanceOf(to, idToCheck2);
    uint256 toBalanceBefore3 = balanceOf(to, idToCheck3);

    safeBatchTransferFrom(e, from, to, ids, amounts, data);

    uint256 fromBalanceAfter1 = balanceOf(from, idToCheck1);
    uint256 fromBalanceAfter2 = balanceOf(from, idToCheck2);
    uint256 fromBalanceAfter3 = balanceOf(from, idToCheck3);

    uint256 toBalanceAfter1 = balanceOf(to, idToCheck1);
    uint256 toBalanceAfter2 = balanceOf(to, idToCheck2);
    uint256 toBalanceAfter3 = balanceOf(to, idToCheck3);

    assert (fromBalanceBefore1 == fromBalanceAfter1 + amountToCheck1)
                && (fromBalanceBefore2 == fromBalanceAfter2 + amountToCheck2)
                && (fromBalanceBefore3 == fromBalanceAfter3 + amountToCheck3), "Something wet wrong";
    assert (toBalanceBefore1 == toBalanceAfter1 - amountToCheck1)
                && (toBalanceBefore2 == toBalanceAfter2 - amountToCheck2)
                && (toBalanceBefore3 == toBalanceAfter3 - amountToCheck3), "Something wet wrong";
}


// STATUS - verified
// cannot transfer more than `from` balance (safeTransferFrom version)
rule cannotTransferMoreSingle(env e){
    address from; address to; uint256 id; uint256 amount; bytes data;
    uint256 balanceBefore = balanceOf(from, id);

    safeTransferFrom@withrevert(e, from, to, id, amount, data);

    assert amount > balanceBefore => lastReverted, "Achtung! Scammer!";
}


// STATUS - verified
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

    assert (amountToCheck1 > balanceBefore1 || amountToCheck2 > balanceBefore2 || amountToCheck3 > balanceBefore3) => lastReverted, "Achtung! Scammer!";
}


// STATUS - verified
// Sender calling safeTransferFrom should only reduce 'from' balance and not other's if sending amount is greater than 0
rule transferBalanceReduceEffect(env e){
    address from; address to; address other;
    uint256 id; uint256 amount; 
    bytes data;

    require other != to;

    uint256 otherBalanceBefore = balanceOf(other, id);

    safeTransferFrom(e, from, to, id, amount, data);

    uint256 otherBalanceAfter = balanceOf(other, id);

    assert from != other => otherBalanceBefore == otherBalanceAfter, "Don't touch my money!";
}


// STATUS - verified
// Sender calling safeTransferFrom should only increase 'to' balance and not other's if sending amount is greater than 0
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


// STATUS - verified
// Sender calling safeTransferFrom should only reduce 'from' balance and not other's if sending amount is greater than 0
rule transferBatchBalanceFromEffect(env e){
    address from; address to; address other;
    uint256[] ids; uint256[] amounts;
    uint256 id1; uint256 amount1; uint256 id2; uint256 amount2; uint256 id3; uint256 amount3;
    bytes data;

    require other != to;

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


// STATUS - verified
// Sender calling safeBatchTransferFrom should only increase 'to' balance and not other's if sending amount is greater than 0
rule transferBatchBalanceToEffect(env e){
    address from; address to; address other;
    uint256[] ids; uint256[] amounts;
    uint256 id1; uint256 amount1; uint256 id2; uint256 amount2; uint256 id3; uint256 amount3;
    bytes data;

    require other != from;

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


// STATUS - verified
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


// STATUS - verified
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


// STATUS - verified
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
// Mint (7/9)
/////////////////////////////////////////////////


// STATUS - verified
// Additivity of _mint: _mint(a); _mint(b) has same effect as _mint(a+b)
rule mintAdditivity(env e){
    address to; uint256 id; uint256 amount; uint256 amount1; uint256 amount2; bytes data;
    require amount == amount1 + amount2;

    storage initialStorage = lastStorage;

    _mint(e, to, id, amount, data);

    uint256 balanceAfterSingleTransaction = balanceOf(to, id);

    _mint(e, to, id, amount1, data) at initialStorage;
    _mint(e, to, id, amount2, data);

    uint256 balanceAfterDoubleTransaction = balanceOf(to, id);

    assert balanceAfterSingleTransaction == balanceAfterDoubleTransaction, "Not additive";
}


// STATUS - verified    
// Chech that `_mint()` revertes in planned scenario(s) (only if `to` is 0)
rule mintRevertCases(env e){
    address to; uint256 id; uint256 amount; bytes data;

    _mint@withrevert(e, to, id, amount, data);

    assert to == 0 => lastReverted, "Should revert";
}


// STATUS - verified
// Chech that `_mintBatch()` revertes in planned scenario(s) (only if `to` is 0 or arrays have different length)
rule mintBatchRevertCases(env e){
    address to; uint256[] ids; uint256[] amounts; bytes data;

    require ids.length < 1000000000;
    require amounts.length < 1000000000;

    _mintBatch@withrevert(e, to, ids, amounts, data);

    assert (ids.length != amounts.length || to == 0) => lastReverted, "Should revert";
}


// STATUS - verified
// Check that mint updates `to` balance correctly
rule mintCorrectWork(env e){
    address to; uint256 id; uint256 amount; bytes data;

    uint256 otherBalanceBefore = balanceOf(to, id);

    _mint(e, to, id, amount, data);

    uint256 otherBalanceAfter = balanceOf(to, id);
    
    assert otherBalanceBefore == otherBalanceAfter - amount, "Something is wrong";
}


// STATUS - verified
// check that mintBatch updates `bootcamp participantsfrom` balance correctly
rule mintBatchCorrectWork(env e){
    address to;
    uint256 id1; uint256 id2; uint256 id3; 
    uint256 amount1; uint256 amount2; uint256 amount3;
    uint256[] ids; uint256[] amounts;
    bytes data;

    require ids.length == 3; 
    require amounts.length == 3; 

    require id1 != id2 && id2 != id3 && id3 != id1;
    require ids[0] == id1; require ids[1] == id2; require ids[2] == id3;
    require amounts[0] == amount1; require amounts[1] == amount2; require amounts[2] == amount3;

    uint256 otherBalanceBefore1 = balanceOf(to, id1);
    uint256 otherBalanceBefore2 = balanceOf(to, id2);
    uint256 otherBalanceBefore3 = balanceOf(to, id3);

    _mintBatch(e, to, ids, amounts, data);

    uint256 otherBalanceAfter1 = balanceOf(to, id1);
    uint256 otherBalanceAfter2 = balanceOf(to, id2);
    uint256 otherBalanceAfter3 = balanceOf(to, id3);
    
    assert otherBalanceBefore1 == otherBalanceAfter1 - amount1
            && otherBalanceBefore2 == otherBalanceAfter2 - amount2
            && otherBalanceBefore3 == otherBalanceAfter3 - amount3
            , "Something is wrong";
}


// STATUS - verified
// The user cannot mint more than max_uint256
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


// STATUS - verified
// `_mint()` changes only `to` balance
rule cantMintOtherBalances(env e){
    address to; uint256 id; uint256 amount; bytes data;
    address other;

    uint256 otherBalanceBefore = balanceOf(other, id);

    _mint(e, to, id, amount, data);

    uint256 otherBalanceAfter = balanceOf(other, id);
    
    assert other != to => otherBalanceBefore == otherBalanceAfter, "I like to see your money disappearing";
}


// STATUS - verified
// mintBatch changes only `to` balance
rule cantMintBatchOtherBalances(env e){
    address to;
    uint256 id1; uint256 id2; uint256 id3; 
    uint256[] ids; uint256[] amounts;
    address other;
    bytes data;

    uint256 otherBalanceBefore1 = balanceOf(other, id1);
    uint256 otherBalanceBefore2 = balanceOf(other, id2);
    uint256 otherBalanceBefore3 = balanceOf(other, id3);

    _mintBatch(e, to, ids, amounts, data);

    uint256 otherBalanceAfter1 = balanceOf(other, id1);
    uint256 otherBalanceAfter2 = balanceOf(other, id2);
    uint256 otherBalanceAfter3 = balanceOf(other, id3);
    
    assert other != to => (otherBalanceBefore1 == otherBalanceAfter1 
                                && otherBalanceBefore2 == otherBalanceAfter2 
                                && otherBalanceBefore3 == otherBalanceAfter3)
                                , "I like to see your money disappearing";
}


/////////////////////////////////////////////////
// Burn (9/9)
/////////////////////////////////////////////////


// STATUS - verified
// Additivity of _burn: _burn(a); _burn(b) has same effect as _burn(a+b)
rule burnAdditivity(env e){
    address from; uint256 id; uint256 amount; uint256 amount1; uint256 amount2;
    require amount == amount1 + amount2;

    storage initialStorage = lastStorage;

    _burn(e, from, id, amount);

    uint256 balanceAfterSingleTransaction = balanceOf(from, id);

    _burn(e, from, id, amount1) at initialStorage;
    _burn(e, from, id, amount2);

    uint256 balanceAfterDoubleTransaction = balanceOf(from, id);

    assert balanceAfterSingleTransaction == balanceAfterDoubleTransaction, "Not additive";
}


// STATUS - verified
// Chech that `_burn()` revertes in planned scenario(s) (if `from` is 0) 
rule burnRevertCases(env e){
    address from; uint256 id; uint256 amount;

    _burn@withrevert(e, from, id, amount);

    assert from == 0 => lastReverted, "Should revert";
}


// STATUS - verified
// Chech that `balanceOf()` revertes in planned scenario(s) (if `from` is 0 or arrays have different length)
rule burnBatchRevertCases(env e){
    address from; uint256[] ids; uint256[] amounts;

    require ids.length < 1000000000;
    require amounts.length < 1000000000;

    _burnBatch@withrevert(e, from, ids, amounts);

    assert (from == 0 || ids.length != amounts.length) => lastReverted, "Should revert";
}


// STATUS - verified
// check that burn updates `from` balance correctly
rule burnCorrectWork(env e){
    address from; uint256 id; uint256 amount;

    uint256 otherBalanceBefore = balanceOf(from, id);

    _burn(e, from, id, amount);

    uint256 otherBalanceAfter = balanceOf(from, id);
    
    assert otherBalanceBefore == otherBalanceAfter + amount, "Something is wrong";
}


// STATUS - verified
// check that burnBatch updates `from` balance correctly
rule burnBatchCorrectWork(env e){
    address from;
    uint256 id1; uint256 id2; uint256 id3; 
    uint256 amount1; uint256 amount2; uint256 amount3;
    uint256[] ids; uint256[] amounts;

    require ids.length == 3; 

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
// the user cannot burn more than they have
rule cantBurnMoreSingle(env e){
    address from; uint256 id; uint256 amount;

    require to_mathint(balanceOf(from, id) - amount) < 0;

    _burn@withrevert(e, from, id, amount);
    
    assert lastReverted, "Don't be too greedy!";
}


// STATUS - verified
// the user cannot burn more than they have (batch version)
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


// STATUS - verified
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
// burnBatch changes only `from` balance
rule cantBurnBatchOtherBalances(env e){
    address from;
    uint256 id1; uint256 id2; uint256 id3; 
    uint256 amount1; uint256 amount2; uint256 amount3;
    uint256[] ids; uint256[] amounts;
    address other;

    uint256 otherBalanceBefore1 = balanceOf(other, id1);
    uint256 otherBalanceBefore2 = balanceOf(other, id2);
    uint256 otherBalanceBefore3 = balanceOf(other, id3);

    _burnBatch(e, from, ids, amounts);

    uint256 otherBalanceAfter1 = balanceOf(other, id1);
    uint256 otherBalanceAfter2 = balanceOf(other, id2);
    uint256 otherBalanceAfter3 = balanceOf(other, id3);
    
    assert other != from => (otherBalanceBefore1 == otherBalanceAfter1 
                                && otherBalanceBefore2 == otherBalanceAfter2 
                                && otherBalanceBefore3 == otherBalanceAfter3)
                                , "I like to see your money disappearing";
}
