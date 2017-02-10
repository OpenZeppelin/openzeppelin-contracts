pragma solidity ^0.4.8;

import "./StandardToken.sol";

contract GrantableToken is StandardToken {
  struct TokenGrant {
    address granter;
    uint256 value;
    uint64 cliff;
    uint64 vesting;
    uint64 start;
  }

  mapping (address => TokenGrant[]) public grants;

  function grantTokens(address _to, uint256 _value) {
    transfer(_to, _value);
  }

  function grantVestedTokens(address _to, uint256 _value, uint64 _start, uint64 _cliff, uint64 _vesting) {
    if (_cliff < _start) throw;
    if (_vesting < _start) throw;
    if (_vesting < _cliff) throw;

    TokenGrant memory grant = TokenGrant({start: _start, value: _value, cliff: _cliff, vesting: _vesting, granter: msg.sender});
    grants[_to].push(grant);

    grantTokens(_to, _value);
  }

  function revokeTokenGrant(address _holder, uint _grantId) {
    TokenGrant grant = grants[_holder][_grantId];

    if (grant.granter != msg.sender) throw;
    uint256 nonVested = nonVestedTokens(grant, uint64(now));

    // remove grant from array
    delete grants[_holder][_grantId];
    grants[_holder][_grantId] = grants[_holder][grants[_holder].length - 1];
    grants[_holder].length -= 1;

    balances[msg.sender] = safeAdd(balances[msg.sender], nonVested);
    balances[_holder] = safeSub(balances[_holder], nonVested);
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

  function vestedTokens(TokenGrant grant, uint64 time) private constant returns (uint256 vestedTokens) {
    if (time < grant.cliff) return 0;
    if (time > grant.vesting) return grant.value;

    uint256 cliffTokens = grant.value * uint256(grant.cliff - grant.start) / uint256(grant.vesting - grant.start);
    vestedTokens = cliffTokens;

    uint256 vestingTokens = safeSub(grant.value, cliffTokens);

    vestedTokens = safeAdd(vestedTokens, vestingTokens * (time - uint256(grant.cliff)) / uint256(grant.vesting - grant.start));
  }

  function nonVestedTokens(TokenGrant grant, uint64 time) private constant returns (uint256) {
    return safeSub(grant.value, vestedTokens(grant, time));
  }

  function lastTokenIsTransferrableEvent(address holder) constant public returns (uint64 date) {
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

  function transfer(address _to, uint _value) returns (bool success){
    if (_value > transferableTokens(msg.sender, uint64(now))) throw;

    return super.transfer(_to, _value);
  }

  function max64(uint64 a, uint64 b) private constant returns (uint64) {
    return a >= b ? a : b;
  }

  function min256(uint256 a, uint256 b) private constant returns (uint256) {
    return a < b ? a : b;
  }
}
