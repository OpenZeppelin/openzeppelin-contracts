pragma solidity ^0.4.8;


import "./StandardToken.sol";


contract VestedToken is StandardToken {
  struct TokenGrant {
    address granter;
    uint256 value;
    uint64 cliff;
    uint64 vesting;
    uint64 start;
  }

  mapping (address => TokenGrant[]) public grants;

  modifier canTransfer(address _sender, uint _value) {
    if (_value > transferableTokens(_sender, uint64(now))) throw;
    _;
  }

  function transfer(address _to, uint _value) canTransfer(msg.sender, _value) returns (bool success) {
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint _value) canTransfer(_from, _value) returns (bool success) {
    return super.transferFrom(_from, _to, _value);
  }

  function grantVestedTokens(
    address _to,
    uint256 _value,
    uint64 _start,
    uint64 _cliff,
    uint64 _vesting) {

    if (_cliff < _start) {
      throw;
    }
    if (_vesting < _start) {
      throw;
    }
    if (_vesting < _cliff) {
      throw;
    }


    TokenGrant memory grant = TokenGrant(msg.sender, _value, _cliff, _vesting, _start);
    grants[_to].push(grant);

    transfer(_to, _value);
  }

  function revokeTokenGrant(address _holder, uint _grantId) {
    TokenGrant grant = grants[_holder][_grantId];

    if (grant.granter != msg.sender) {
      throw;
    }
    uint256 nonVested = nonVestedTokens(grant, uint64(now));

    // remove grant from array
    delete grants[_holder][_grantId];
    grants[_holder][_grantId] = grants[_holder][grants[_holder].length - 1];
    grants[_holder].length -= 1;

    balances[msg.sender] = safeAdd(balances[msg.sender], nonVested);
    balances[_holder] = safeSub(balances[_holder], nonVested);
    Transfer(_holder, msg.sender, nonVested);
  }

  function tokenGrantsCount(address _holder) constant returns (uint index) {
    return grants[_holder].length;
  }

  function tokenGrant(address _holder, uint _grantId) constant returns (address granter, uint256 value, uint256 vested, uint64 start, uint64 cliff, uint64 vesting) {
    TokenGrant grant = grants[_holder][_grantId];

    granter = grant.granter;
    value = grant.value;
    start = grant.start;
    cliff = grant.cliff;
    vesting = grant.vesting;

    vested = vestedTokens(grant, uint64(now));
  }

  function vestedTokens(TokenGrant grant, uint64 time) private constant returns (uint256) {
    return calculateVestedTokens(
      grant.value,
      uint256(time),
      uint256(grant.start),
      uint256(grant.cliff),
      uint256(grant.vesting)
    );
  }

  function calculateVestedTokens(
    uint256 tokens,
    uint256 time,
    uint256 start,
    uint256 cliff,
    uint256 vesting) constant returns (uint256 vestedTokens)
    {

    if (time < cliff) {
      return 0;
    }
    if (time > vesting) {
      return tokens;
    }

    uint256 cliffTokens = safeDiv(safeMul(tokens, safeSub(cliff, start)), safeSub(vesting, start));
    vestedTokens = cliffTokens;

    uint256 vestingTokens = safeSub(tokens, cliffTokens);

    vestedTokens = safeAdd(vestedTokens, safeDiv(safeMul(vestingTokens, safeSub(time, cliff)), safeSub(vesting, start)));
  }

  function nonVestedTokens(TokenGrant grant, uint64 time) private constant returns (uint256) {
    return safeSub(grant.value, vestedTokens(grant, time));
  }

  function lastTokenIsTransferableDate(address holder) constant public returns (uint64 date) {
    date = uint64(now);
    uint256 grantIndex = grants[holder].length;
    for (uint256 i = 0; i < grantIndex; i++) {
      date = max64(grants[holder][i].vesting, date);
    }
  }

  function transferableTokens(address holder, uint64 time) constant public returns (uint256 nonVested) {
    uint256 grantIndex = grants[holder].length;

    for (uint256 i = 0; i < grantIndex; i++) {
      nonVested = safeAdd(nonVested, nonVestedTokens(grants[holder][i], time));
    }

    return safeSub(balances[holder], nonVested);
  }
}
