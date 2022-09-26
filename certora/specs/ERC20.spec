import "erc20.spec"

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost & hooks: sum of all balances                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost sumOfBalances() returns uint256 {
  init_state axiom sumOfBalances() == 0;
}

hook Sstore _balances[KEY address addr] uint256 newValue (uint256 oldValue) STORAGE {
    havoc sumOfBalances assuming sumOfBalances@new() == sumOfBalances@old() + newValue - oldValue;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: totalSupply is the sum of all balances                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant totalSupplyIsSumOfBalances()
    totalSupply() == sumOfBalances()

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: balance of address(0) is 0                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant zeroAddressNoBalance()
    balanceOf(0) == 0

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: totalSupply only changes through mint or burn                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noChangeTotalSupply() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
    method f;
    calldataarg args;

    uint256 totalSupplyBefore = totalSupply();
    f(e, args);
    uint256 totalSupplyAfter = totalSupply();

    assert (totalSupplyAfter > totalSupplyBefore) => (f.selector == mint(address,uint256).selector);
    assert (totalSupplyAfter < totalSupplyBefore) => (f.selector == burn(address,uint256).selector);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: totalSupply change matches minted or burned amount                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule mintIncreasesTotalSupply() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
    address to;
    uint256 amount;

    uint256 totalSupplyBefore = totalSupply();
    mint(e, to, amount);
    uint256 totalSupplyAfter = totalSupply();

    assert totalSupplyAfter == totalSupplyBefore + amount;
}

rule burnDecreasesTotalSupply() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
    address from;
    uint256 amount;

    uint256 totalSupplyBefore = totalSupply();
    burn(e, from, amount);
    uint256 totalSupplyAfter = totalSupply();

    assert totalSupplyAfter == totalSupplyBefore - amount;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: Balance of an account can only decrease if the tx was sent by owner or by approved                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyAuthorizedCanTransfer() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
    method f;
    calldataarg args;
    address account;

    uint256 allowanceBefore = allowance(account, e.msg.sender);
    uint256 balanceBefore   = balanceOf(account);
    f(e, args);
    uint256 balanceAfter    = balanceOf(account);

    assert (
        balanceAfter < balanceBefore
    ) => (
        f.selector == burn(address,uint256).selector ||
        e.msg.sender == account ||
        balanceBefore - balanceAfter <= allowanceBefore
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: transfer moves correct amount from sender to receiver                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule transferAmount() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
    address holder = e.msg.sender;
    address recipient;
    uint256 amount;

    uint256 holderBalanceBefore    = balanceOf(holder);
    uint256 recipientBalanceBefore = balanceOf(recipient);

    transfer(e, recipient, amount);

    assert balanceOf(holder)    == holderBalanceBefore    - (holder == recipient ? 0 : amount);
    assert balanceOf(recipient) == recipientBalanceBefore + (holder == recipient ? 0 : amount);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: transferFrom moves correct amount from holder to receiver, and updates allowance                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule transferFomAmountAndApproval() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
    address holder;
    address recipient;
    uint256 amount;

    uint256 allowanceBefore        = allowance(holder, e.msg.sender);
    uint256 holderBalanceBefore    = balanceOf(holder);
    uint256 recipientBalanceBefore = balanceOf(recipient);

    transferFrom(e, holder, recipient, amount);

    assert allowanceBefore                 >= amount;
    assert allowance(holder, e.msg.sender) == (allowanceBefore == max_uint256 ? to_uint256(max_uint256) : allowanceBefore - amount);
    assert balanceOf(holder)               == holderBalanceBefore    - (holder == recipient ? 0 : amount);
    assert balanceOf(recipient)            == recipientBalanceBefore + (holder == recipient ? 0 : amount);
}
