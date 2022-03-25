using ERC20VotesHarness as erc20votes

methods {
    // functions
    checkpoints(address, uint32) envfree
    numCheckpoints(address) returns (uint32) envfree
    delegates(address) returns (address) envfree
    getVotes(address) returns (uint256) envfree
    getPastVotes(address, uint256) returns (uint256)
    getPastTotalSupply(uint256) returns (uint256)
    delegate(address)
    _delegate(address, address)
    delegateBySig(address, uint256, uint256, uint8, bytes32, bytes32)
    totalSupply() returns (uint256) envfree
    _maxSupply() returns (uint224) envfree

    // harnesss functions
    ckptFromBlock(address, uint32) returns (uint32) envfree
    ckptVotes(address, uint32) returns (uint224) envfree
    mint(address, uint256)
    burn(address, uint256)

    // solidity generated getters
    _delegates(address) returns (address) envfree

    // external functions


}
// gets the most recent votes for a user
ghost userVotes(address) returns uint224;

// sums the total votes for all users
ghost totalVotes() returns mathint {
    axiom totalVotes() > 0;
}



hook Sstore _checkpoints[KEY address account][INDEX uint32 index].votes uint224 newVotes (uint224 oldVotes) STORAGE {
    havoc userVotes assuming
        userVotes@new(account) == newVotes;

    havoc totalVotes assuming
        totalVotes@new() == totalVotes@old() + to_mathint(newVotes) - to_mathint(userVotes(account));
}


ghost lastFromBlock(address) returns uint32;

ghost doubleFromBlock(address) returns bool {
    init_state axiom forall address a. doubleFromBlock(a) == false;
}


hook Sstore _checkpoints[KEY address account][INDEX uint32 index].fromBlock uint32 newBlock (uint32 oldBlock) STORAGE {
    havoc lastFromBlock assuming
        lastFromBlock@new(account) == newBlock;
    
    havoc doubleFromBlock assuming 
        doubleFromBlock@new(account) == (newBlock == oldBlock);
}

rule sanity(method f) {
    env e;
    calldataarg arg;
    f(e, arg);
    assert false;
}

// something stupid just to see 
invariant sanity_invariant()
    totalSupply() >= 0

// sum of user balances is >= total amount of delegated votes
invariant votes_solvency()
    to_mathint(totalSupply()) >= totalVotes()

// for some checkpoint, the fromBlock is less than the current block number
// passes but fails rule sanity from hash on delegate by sig
invariant timestamp_constrains_fromBlock(address account, uint32 index, env e)
    ckptFromBlock(account, index) < e.block.number
{
    preserved {
        require index < numCheckpoints(account);
    }
}

// numCheckpoints are less than maxInt
// passes
invariant maxInt_constrains_numBlocks(address account)
    numCheckpoints(account) <= 4294967295 // 2^32

// can't have more checkpoints for a given account than the last from block
invariant fromBlock_constrains_numBlocks(address account)
    numCheckpoints(account) <= lastFromBlock(account)

invariant unique_checkpoints(address account)
    !doubleFromBlock(account)

rule transfer_safe() {
    env e;
    uint256 amount;
    address a; address b;
    require a != b;

    uint256 votesA_pre = getVotes(a);
    uint256 votesB_pre = getVotes(b);

    require votesA_pre == erc20votes.balanceOf(e, a);
    require votesB_pre == erc20votes.balanceOf(e, b);

    mathint totalVotes_pre = totalVotes();

    erc20votes.transferFrom(e, a, b, amount);
    
    mathint totalVotes_post = totalVotes();
    uint256 votesA_post = getVotes(a);
    uint256 votesB_post = getVotes(b);

    assert totalVotes_pre == totalVotes_post, "transfer changed total supply";
    assert votesA_pre - votesA_post == amount, "a lost the proper amount of votes";
    assert votesB_post - votesB_pre == amount, "b lost the proper amount of votes";
}


rule delegator_votes_removed() {
    env e;
    address delegator; address delegatee;

    require delegator != delegatee;
    require delegates(delegator) == 0; // has not delegated

    uint256 pre = getVotes(delegator);

    _delegate(e, delegator, delegatee);

    uint256 balance = balanceOf(e, delegator);

    uint256 post = getVotes(delegator);
    assert post == pre - balance, "delegator retained votes";
}

rule delegatee_receives_votes() {
    env e; 
    address delegator; address delegatee;
    require delegator != delegatee;

    uint256 delegator_bal = balanceOf(e, delegator);
    uint256 votes_= getVotes(delegatee);

    _delegate(e, delegator, delegatee);

    uint256 _votes = getVotes(delegatee);

    assert _votes == votes_ + delegator_bal, "delegatee did not receive votes";
}

rule previous_delegatee_zerod() {
    env e;
    address delegator; address delegatee; address third;

    require delegator != delegatee;
    require third != delegatee;
    require third != delegator;

    uint256 delegator_bal = balanceOf(e, delegator);
    uint256 votes_ = getVotes(third);

    _delegate(e, delegator, delegatee);

    uint256 _votes = getVotes(third);

    assert votes_ == votes_ - delegator_bal, "votes not removed from the previous delegatee";
}

// passes
rule delegate_contained() {
    env e;
    address delegator; address delegatee; address other;

    require delegator != delegatee;
    require other != delegator;
    require other != delegatee;
    require other != delegates(delegator); 

    uint256 votes_ = getVotes(other);

    _delegate(e, delegator, delegatee);

    uint256 _votes = getVotes(other);

    assert votes_ == _votes, "votes not contained";
}

// checks all of the above rules with front running 
rule delegate_no_frontrunning(method f) {
    env e; calldataarg args;
    address delegator; address delegatee; address third; address other;

    require delegator != delegatee;
    require delegates(delegator) == third;
    require other != third;

    uint256 delegator_bal = erc20votes.balanceOf(e, delegator);

    uint256 dr_ = getVotes(delegator);
    uint256 de_ = getVotes(delegatee);
    uint256 third_ = getVotes(third);
    uint256 other_ = getVotes(other);

    // require third is address for previous delegator
    f(e, args);
    _delegate(e, delegator, delegatee);

    uint256 _dr = getVotes(delegator);
    uint256 _de = getVotes(delegatee);
    uint256 _third = getVotes(third);
    uint256 _other = getVotes(other);


    // delegator loses all of their votes
    // delegatee gains that many votes
    // third loses any votes delegated to them
    assert _dr == 0, "delegator retained votes";
    assert _de == de_ + delegator_bal, "delegatee not received votes";
    assert _third != 0 => _third == third_ - delegator_bal, "votes not removed from third";
    assert other_ == _other, "delegate not contained";
}

// passes
rule mint_increases_totalSupply() {

    env e;
    uint256 amount; address account;

    uint256 fromBlock = e.block.number;
    uint256 totalSupply_ = totalSupply();

    mint(e, account, amount);

    uint256 _totalSupply = totalSupply();
    require _totalSupply < _maxSupply();

    assert _totalSupply == totalSupply_ + amount, "totalSupply not increased properly";
    assert getPastTotalSupply(e, fromBlock) == totalSupply_ , "previous total supply not saved properly";
}

// passes
rule burn_decreases_totalSupply() {
    env e;
    uint256 amount; address account;

    uint256 fromBlock = e.block.number;
    uint256 totalSupply_ = totalSupply();
    require totalSupply_ > balanceOf(e, account);

    burn(e, account, amount);

    uint256 _totalSupply = totalSupply();
    require _totalSupply < _maxSupply();

    assert _totalSupply == totalSupply_ - amount, "totalSupply not decreased properly";
    assert getPastTotalSupply(e, fromBlock) == totalSupply_ , "previous total supply not saved properly";
}



// passes
rule mint_doesnt_increase_totalVotes() {
    env e;
    uint256 amount; address account;

    mathint totalVotes_ = totalVotes();

    mint(e, account, amount);

    assert totalVotes() == totalVotes_, "totalVotes increased";
}
// passes
rule burn_doesnt_decrease_totalVotes() {
    env e;
    uint256 amount; address account;

    mathint totalVotes_ = totalVotes();

    burn(e, account, amount);

    assert totalVotes() == totalVotes_, "totalVotes decreased";
}

// // fails
// rule mint_increases_totalVotes() {
//     env e;
//     uint256 amount; address account;

//     mathint totalVotes_ = totalVotes();

//     mint(e, account, amount);

//     assert totalVotes() == totalVotes_ + to_mathint(amount), "totalVotes not increased";
// }

// // fails
// rule burn_decreases_totalVotes() {
//     env e;
//     uint256 amount; address account;

//     mathint totalVotes_ = totalVotes();

//     burn(e, account, amount);

//     assert totalVotes() == totalVotes_ - to_mathint(amount), "totalVotes not decreased";
// }
