pragma solidity ^0.4.8;

import "./StandardToken.sol";

contract GrantableToken is StandardToken {
  struct StockGrant {
    address granter;
    uint256 value;
    uint64 cliff;
    uint64 vesting;
    uint64 start;
  }

  mapping (address => StockGrant[]) public grants;

  function grantStock(address _to, uint256 _value) {
    transfer(_to, _value);
  }

  function grantVestedStock(address _to, uint256 _value, uint64 _start, uint64 _cliff, uint64 _vesting) {
    if (_cliff < _start) throw;
    if (_vesting < _start) throw;
    if (_vesting < _cliff) throw;

    StockGrant memory grant = StockGrant({start: _start, value: _value, cliff: _cliff, vesting: _vesting, granter: msg.sender});
    grants[_to].push(grant);

    grantStock(_to, _value);
  }

  function revokeStockGrant(address _holder, uint _grantId) {
    StockGrant grant = grants[_holder][_grantId];

    if (grant.granter != msg.sender) throw;
    uint256 nonVested = nonVestedShares(grant, uint64(now));

    // remove grant from array
    delete grants[_holder][_grantId];
    grants[_holder][_grantId] = grants[_holder][grants[_holder].length - 1];
    grants[_holder].length -= 1;

    balances[msg.sender] = safeAdd(balances[msg.sender], nonVested);
    balances[_holder] = safeSub(balances[_holder], nonVested);
  }

  function stockGrantCount(address _holder) constant returns (uint index) {
    return grants[_holder].length;
  }

  function stockGrant(address _holder, uint _grantId) constant returns (address granter, uint256 value, uint256 vested, uint64 start, uint64 cliff, uint64 vesting) {
    StockGrant grant = grants[_holder][_grantId];

    granter = grant.granter;
    value = grant.value;
    start = grant.start;
    cliff = grant.cliff;
    vesting = grant.vesting;

    vested = vestedShares(grant, uint64(now));
  }

  function vestedShares(StockGrant grant, uint64 time) private constant returns (uint256 vestedShares) {
    if (time < grant.cliff) return 0;
    if (time > grant.vesting) return grant.value;

    uint256 cliffShares = grant.value * uint256(grant.cliff - grant.start) / uint256(grant.vesting - grant.start);
    vestedShares = cliffShares;

    uint256 vestingShares = safeSub(grant.value, cliffShares);

    vestedShares = safeAdd(vestedShares, vestingShares * (time - uint256(grant.cliff)) / uint256(grant.vesting - grant.start));
  }

  function nonVestedShares(StockGrant grant, uint64 time) private constant returns (uint256) {
    return safeSub(grant.value, vestedShares(grant, time));
  }

  function lastStockIsTransferrableEvent(address holder) constant public returns (uint64 date) {
    date = uint64(now);
    uint256 grantIndex = grants[holder].length;
    for (uint256 i = 0; i < grantIndex; i++) {
      date = max64(grants[holder][i].vesting, date);
    }
  }

  function transferrableShares(address holder, uint64 time) constant public returns (uint256 nonVested) {
    uint256 grantIndex = grants[holder].length;

    for (uint256 i = 0; i < grantIndex; i++) {
      nonVested = safeAdd(nonVested, nonVestedShares(grants[holder][i], time));
    }

    return safeSub(balances[holder], nonVested);
  }

  function transfer(address _to, uint _value) returns (bool success){
    if (_value > transferrableShares(msg.sender, uint64(now))) throw;

    return super.transfer(_to, _value);
  }

  function max64(uint64 a, uint64 b) private constant returns (uint64) {
    return a >= b ? a : b;
  }

  function min256(uint256 a, uint256 b) private constant returns (uint256) {
    return a < b ? a : b;
  }
}
