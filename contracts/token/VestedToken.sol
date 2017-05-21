pragma solidity ^0.4.8;

import "./StandardToken.sol";
import "./TransferableToken.sol";

contract VestedToken is StandardToken, TransferableToken {
  struct TokenGrant {
    address granter;     // 20 bytes
    uint256 value;       // 32 bytes
    uint64 cliff;
    uint64 vesting;
    uint64 start;        // 3 * 8 = 24 bytes
    bool revokable;
    bool burnsOnRevoke;  // 2 * 1 = 2 bits? or 2 bytes?
  } // total 78 bytes = 3 sstore per operation (32 per sstore)

  mapping (address => TokenGrant[]) public grants;

  event NewTokenGrant(address indexed from, address indexed to, uint256 value, uint256 grantId);

  function grantVestedTokens(
    address _to,
    uint256 _value,
    uint64 _start,
    uint64 _cliff,
    uint64 _vesting,
    bool _revokable,
    bool _burnsOnRevoke
  ) public {

    // Check for date inconsistencies that may cause unexpected behavior
    if (_cliff < _start || _vesting < _cliff) {
      throw;
    }

    uint id = grants[_to].push(
                TokenGrant(
                  _revokable ? msg.sender : 0, // avoid storing an extra 20 bytes when it is non-revokable
                  _value,
                  _cliff,
                  _vesting,
                  _start,
                  _revokable,
                  _burnsOnRevoke
                )
              );

    transfer(_to, _value);

    NewTokenGrant(msg.sender, _to, _value, id);
  }

  function revokeTokenGrant(address _holder, uint _grantId) public {
    TokenGrant grant = grants[_holder][_grantId];

    if (!grant.revokable) { // Check if grant was revokable
      throw;
    }

    if (grant.granter != msg.sender) { // Only granter can revoke it
      throw;
    }

    address receiver = grant.burnsOnRevoke ? 0xdead : msg.sender;

    uint256 nonVested = nonVestedTokens(grant, uint64(now));

    // remove grant from array
    delete grants[_holder][_grantId];
    grants[_holder][_grantId] = grants[_holder][grants[_holder].length - 1];
    grants[_holder].length -= 1;

    balances[receiver] = safeAdd(balances[receiver], nonVested);
    balances[_holder] = safeSub(balances[_holder], nonVested);
    Transfer(_holder, receiver, nonVested);
  }

  function transferableTokens(address holder, uint64 time) constant public returns (uint256 nonVested) {
    uint256 grantIndex = tokenGrantsCount(holder);
    for (uint256 i = 0; i < grantIndex; i++) {
      nonVested = safeAdd(nonVested, nonVestedTokens(grants[holder][i], time));
    }

    return min256(safeSub(balances[holder], nonVested), super.transferableTokens(holder, time));
  }

  function tokenGrantsCount(address _holder) constant returns (uint index) {
    return grants[_holder].length;
  }

  function tokenGrant(address _holder, uint _grantId) constant returns (address granter, uint256 value, uint256 vested, uint64 start, uint64 cliff, uint64 vesting, bool revokable, bool burnsOnRevoke) {
    TokenGrant grant = grants[_holder][_grantId];

    granter = grant.granter;
    value = grant.value;
    start = grant.start;
    cliff = grant.cliff;
    vesting = grant.vesting;
    revokable = grant.revokable;
    burnsOnRevoke = grant.burnsOnRevoke;

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
}
