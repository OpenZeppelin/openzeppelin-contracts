import "helpers/helpers.spec"
import "methods/IAccessControlDefaultAdminRules.spec"
import "methods/IAccessControl.spec"
import "AccessControl.spec"

use rule onlyGrantCanGrant filtered {
  f -> f.selector != acceptDefaultAdminTransfer().selector
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helpers                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

function max_uint48() returns mathint {
    return (1 << 48) - 1;
}

function nonZeroAccount(address account) returns bool {
  return account != 0;
}

function timeSanity(env e) returns bool {
  return
    e.block.timestamp > 0 && // Avoids 0 schedules
    e.block.timestamp + defaultAdminDelay(e) < max_uint48();
}

function delayChangeWaitSanity(env e, uint48 newDelay) returns bool {
  return e.block.timestamp + delayChangeWait_(e, newDelay) < max_uint48();
}

function isSet(uint48 schedule) returns bool {
  return schedule != 0;
}

function hasPassed(env e, uint48 schedule) returns bool {
  return schedule < e.block.timestamp;
}

function min(uint48 a, uint48 b) returns mathint {
  return a < b ? a : b;
}

function increasingDelaySchedule(env e, uint48 newDelay) returns mathint {
  return e.block.timestamp + min(newDelay, defaultAdminDelayIncreaseWait());
}

function decreasingDelaySchedule(env e, uint48 newDelay) returns mathint {
  return e.block.timestamp + defaultAdminDelay(e) - newDelay;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: defaultAdmin holds the DEFAULT_ADMIN_ROLE                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant defaultAdminConsistency(address account)
  defaultAdmin() == account <=> hasRole(DEFAULT_ADMIN_ROLE(), account)
  {
    preserved {
      // defaultAdmin() returns the zero address when there's no default admin
      require nonZeroAccount(account);
    }
  }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: Only one account holds the DEFAULT_ADMIN_ROLE                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant singleDefaultAdmin(address account, address another)
  hasRole(DEFAULT_ADMIN_ROLE(), account) && hasRole(DEFAULT_ADMIN_ROLE(), another) => another == account
  // We filter here because we couldn't find a way to force Certora to have an initial state with
  // only one DEFAULT_ADMIN_ROLE enforced, so a counter example is a different default admin since inception
  // triggering the transfer, which is known to be impossible by definition.
  filtered { f -> f.selector != acceptDefaultAdminTransfer().selector }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: DEFAULT_ADMIN_ROLE's admin is always DEFAULT_ADMIN_ROLE                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant defaultAdminRoleAdminConsistency()
  getRoleAdmin(DEFAULT_ADMIN_ROLE()) == DEFAULT_ADMIN_ROLE()

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: owner is the defaultAdmin                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant ownerConsistency()
  defaultAdmin() == owner()

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: revokeRole only affects the specified user/role combo                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule revokeRoleEffect(env e, bytes32 role) {
    require nonpayable(e);

    bytes32 otherRole;
    address account;
    address otherAccount;

    bool isCallerAdmin = hasRole(getRoleAdmin(role), e.msg.sender);
    bool hasOtherRoleBefore = hasRole(otherRole, otherAccount);

    revokeRole@withrevert(e, role, account);
    bool success = !lastReverted;

    bool hasOtherRoleAfter = hasRole(otherRole, otherAccount);

    // liveness
    assert success <=> isCallerAdmin && role != DEFAULT_ADMIN_ROLE(),
      "roles can only be revoked by their owner except for the default admin role";

    // effect
    assert success => !hasRole(role, account), "role is revoked";

    // no side effect
    assert hasOtherRoleBefore != hasOtherRoleAfter => (role == otherRole && account == otherAccount),
      "no other role is affected";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: renounceRole only affects the specified user/role combo                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule renounceRoleEffect(env e, bytes32 role) {
    require nonpayable(e);

    bytes32 otherRole;
    address account;
    address otherAccount;

    bool hasOtherRoleBefore = hasRole(otherRole, otherAccount);
    uint48 scheduleBefore = pendingDefaultAdminSchedule_();
    address pendingAdminBefore = pendingDefaultAdmin_();

    renounceRole@withrevert(e, role, account);
    bool success = !lastReverted;

    bool hasOtherRoleAfter = hasRole(otherRole, otherAccount);

    // liveness
    assert success <=> (
      account == e.msg.sender &&
      (
        (
          role != DEFAULT_ADMIN_ROLE()
        ) || (
          role == DEFAULT_ADMIN_ROLE() &&
          pendingAdminBefore == 0 &&
          isSet(scheduleBefore) &&
          hasPassed(e, scheduleBefore)
        )
      )
    ), "an account only can renounce by itself with a delay for the default admin role";

    // effect
    assert success => !hasRole(role, account), "role is renounced";

    // no side effect
    assert hasOtherRoleBefore != hasOtherRoleAfter => (role == otherRole && account == otherAccount),
      "no other role is affected";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: defaultAdmin is only affected by accepting an admin transfer or renoucing                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noDefaultAdminChange(env e, method f, calldataarg args) {
  require nonZeroAccount(e.msg.sender);
  requireInvariant defaultAdminConsistency(defaultAdmin());
  requireInvariant singleDefaultAdmin(e.msg.sender, defaultAdmin());

  address adminBefore = defaultAdmin();
  f(e, args);
  address adminAfter = defaultAdmin();

  assert adminBefore != adminAfter => (
    f.selector == acceptDefaultAdminTransfer().selector ||
    f.selector == renounceRole(bytes32,address).selector
  ), "default admin is only affected by accepting an admin transfer or renoucing";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: pendingDefaultAdmin is only affected by beginning, accepting or canceling an admin transfer                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noPendingDefaultAdminChange(env e, method f, calldataarg args) {
  requireInvariant defaultAdminConsistency(defaultAdmin());
  requireInvariant singleDefaultAdmin(e.msg.sender, defaultAdmin());

  address pendingAdminBefore = pendingDefaultAdmin_();
  address scheduleBefore = pendingDefaultAdminSchedule_();
  f(e, args);
  address pendingAdminAfter = pendingDefaultAdmin_();
  address scheduleAfter = pendingDefaultAdminSchedule_();

  assert (
    pendingAdminBefore != pendingAdminAfter ||
    scheduleBefore != scheduleAfter
  ) => (
    f.selector == beginDefaultAdminTransfer(address).selector ||
    f.selector == acceptDefaultAdminTransfer().selector ||
    f.selector == cancelDefaultAdminTransfer().selector
  ), "pending admin and its schedule is only affected by beginning, accepting or cancelling an admin transfer";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: defaultAdminDelay can't be changed atomically by any function                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noDefaultAdminDelayChange(env e, method f, calldataarg args) {
  uint48 delayBefore = defaultAdminDelay(e);
  f(e, args);
  uint48 delayAfter = defaultAdminDelay(e);

  assert delayBefore == delayAfter, "delay can't be changed atomically by any function";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: pendingDefaultAdminDelay is only affected by changeDefaultAdminDelay or rollbackDefaultAdminDelay             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noPendingDefaultAdminDelayChange(env e, method f, calldataarg args) {
  uint48 pendingDelayBefore = pendingDelay_(e);
  f(e, args);
  uint48 pendingDelayAfter = pendingDelay_(e);

  assert pendingDelayBefore != pendingDelayAfter => (
    f.selector == changeDefaultAdminDelay(uint48).selector ||
    f.selector == rollbackDefaultAdminDelay().selector
  ), "pending delay is only affected by changeDefaultAdminDelay or rollbackDefaultAdminDelay";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: defaultAdminDelayIncreaseWait can't be changed atomically by any function                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noDefaultAdminDelayIncreaseWaitChange(env e, method f, calldataarg args) {
  uint48 delayIncreaseWaitBefore = defaultAdminDelayIncreaseWait();
  f(e, args);
  uint48 delayIncreaseWaitAfter = defaultAdminDelayIncreaseWait();

  assert delayIncreaseWaitBefore == delayIncreaseWaitAfter,
    "delay increase wait can't be changed atomically by any function";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: beginDefaultAdminTransfer sets a pending default admin and its schedule                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule beginDefaultAdminTransfer(env e, address newAdmin) {
  require nonpayable(e);
  require timeSanity(e);
  requireInvariant defaultAdminConsistency(defaultAdmin());
  requireInvariant singleDefaultAdmin(e.msg.sender, defaultAdmin());

  beginDefaultAdminTransfer@withrevert(e, newAdmin);
  bool success = !lastReverted;

  // liveness
  assert success <=> e.msg.sender == defaultAdmin(),
    "only the current default admin can begin a transfer";

  // effect
  assert success => pendingDefaultAdmin_() == newAdmin,
    "pending default admin is set";
  assert success => pendingDefaultAdminSchedule_() == e.block.timestamp + defaultAdminDelay(e),
    "pending default admin delay is set";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: A default admin can't change in less than the applied schedule                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pendingDefaultAdminDelayEnforced(env e1, env e2, method f, calldataarg args, address newAdmin) {
  require e1.block.timestamp < e2.block.timestamp;

  uint48 delayBefore = defaultAdminDelay(e1);
  address adminBefore = defaultAdmin();
  // There might be a better way to generalize this without requiring `beginDefaultAdminTransfer`, but currently
  // it's the only way in which we can attest that only `delayBefore` has passed before a change.
  beginDefaultAdminTransfer(e1, newAdmin);
  f(e2, args);
  address adminAfter = defaultAdmin();

  assert adminAfter == newAdmin => ((e2.block.timestamp >= e1.block.timestamp + delayBefore) || adminBefore == newAdmin),
    "A delay can't change in less than applied schedule";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: acceptDefaultAdminTransfer updates defaultAdmin resetting the pending admin and its schedule  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule acceptDefaultAdminTransfer(env e) {
  require nonpayable(e);
  requireInvariant defaultAdminConsistency(defaultAdmin());
  requireInvariant singleDefaultAdmin(e.msg.sender, defaultAdmin());

  address pendingAdminBefore = pendingDefaultAdmin_();
  uint48 scheduleAfter = pendingDefaultAdminSchedule_();

  acceptDefaultAdminTransfer@withrevert(e);
  bool success = !lastReverted;

  // liveness
  assert success <=> e.msg.sender == pendingAdminBefore && isSet(scheduleAfter) && hasPassed(e, scheduleAfter),
    "only the pending default admin can accept the role after the schedule has been set and passed";

  // effect
  assert success => defaultAdmin() == pendingAdminBefore,
    "Default admin is set to the previous pending default admin";
  assert success => pendingDefaultAdmin_() == 0,
    "Pending default admin is reset";
  assert success => pendingDefaultAdminSchedule_() == 0,
    "Pending default admin delay is reset";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: cancelDefaultAdminTransfer resets pending default admin and its schedule                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule cancelDefaultAdminTransfer(env e) {
  require nonpayable(e);
  requireInvariant defaultAdminConsistency(defaultAdmin());
  requireInvariant singleDefaultAdmin(e.msg.sender, defaultAdmin());

  cancelDefaultAdminTransfer@withrevert(e);
  bool success = !lastReverted;

  // liveness
  assert success <=> e.msg.sender == defaultAdmin(),
    "only the current default admin can cancel a transfer";

  // effect
  assert success => pendingDefaultAdmin_() == 0,
    "Pending default admin is reset";
  assert success => pendingDefaultAdminSchedule_() == 0,
    "Pending default admin delay is reset";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: changeDefaultAdminDelay sets a pending default admin delay and its schedule                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule changeDefaultAdminDelay(env e, uint48 newDelay) {
  require nonpayable(e);
  require timeSanity(e);
  require delayChangeWaitSanity(e, newDelay);
  requireInvariant defaultAdminConsistency(defaultAdmin());
  requireInvariant singleDefaultAdmin(e.msg.sender, defaultAdmin());

  uint48 delayBefore = defaultAdminDelay(e);

  changeDefaultAdminDelay@withrevert(e, newDelay);
  bool success = !lastReverted;

  // liveness
  assert success <=> e.msg.sender == defaultAdmin(),
    "only the current default admin can begin a delay change";

  // effect
  assert success => pendingDelay_(e) == newDelay, "pending delay is set";
  assert success => (
    pendingDelaySchedule_(e) > e.block.timestamp ||
    delayBefore == newDelay || // Interpreted as decreasing, x - x = 0
    defaultAdminDelayIncreaseWait() == 0
  ),
    "pending delay schedule is set in the future unless accepted edge cases";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: A delay can't change in less than the applied schedule                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pendingDelayWaitEnforced(env e1, env e2, method f, calldataarg args, uint48 newDelay) {
  require e1.block.timestamp < e2.block.timestamp;

  uint48 delayBefore = defaultAdminDelay(e1);
  changeDefaultAdminDelay(e1, newDelay);
  f(e2, args);
  uint48 delayAfter = defaultAdminDelay(e2);

  mathint delayWait = newDelay > delayBefore ? increasingDelaySchedule(e1, newDelay) : decreasingDelaySchedule(e1, newDelay);

  assert delayAfter == newDelay => (e2.block.timestamp >= delayWait || delayBefore == newDelay),
    "A delay can't change in less than applied schedule";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: pending delay wait is set depending on increasing or decreasing the delay                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pendingDelayWait(env e, uint48 newDelay) {
  uint48 oldDelay = defaultAdminDelay(e);
  changeDefaultAdminDelay(e, newDelay);

  assert newDelay > oldDelay => pendingDelaySchedule_(e) == increasingDelaySchedule(e, newDelay),
    "Delay wait is the minimum between the new delay and a threshold when the delay is increased";
  assert newDelay <= oldDelay => pendingDelaySchedule_(e) == decreasingDelaySchedule(e, newDelay),
    "Delay wait is the difference between the current and the new delay when the delay is decreased";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: rollbackDefaultAdminDelay resets the delay and its schedule                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule rollbackDefaultAdminDelay(env e) {
  require nonpayable(e);
  requireInvariant defaultAdminConsistency(defaultAdmin());
  requireInvariant singleDefaultAdmin(e.msg.sender, defaultAdmin());

  rollbackDefaultAdminDelay@withrevert(e);
  bool success = !lastReverted;

  // liveness
  assert success <=> e.msg.sender == defaultAdmin(),
    "only the current default admin can rollback a delay change";

  // effect
  assert success => pendingDelay_(e) == 0,
    "Pending default admin is reset";
  assert success => pendingDelaySchedule_(e) == 0,
    "Pending default admin delay is reset";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: pending default admin and the delay can only change along with their corresponding schedules                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pendingValueAndScheduleCoupling(env e, address newAdmin, uint48 newDelay) {
  requireInvariant defaultAdminConsistency(defaultAdmin());
  requireInvariant singleDefaultAdmin(e.msg.sender, defaultAdmin());

  // Pending admin
  address pendingAdminBefore = pendingDefaultAdmin_();
  uint48 pendingAdminScheduleBefore = pendingDefaultAdminSchedule_();

  beginDefaultAdminTransfer(e, newAdmin);

  address pendingAdminAfter = pendingDefaultAdmin_();
  uint48 pendingAdminScheduleAfter = pendingDefaultAdminSchedule_();

  assert (
    pendingAdminScheduleBefore != pendingDefaultAdminSchedule_() &&
    pendingAdminBefore == pendingAdminAfter
  ) => newAdmin == pendingAdminBefore, "pending admin stays the same if the new admin set is the same";

  assert (
    pendingAdminBefore != pendingAdminAfter &&
    pendingAdminScheduleBefore == pendingDefaultAdminSchedule_()
  ) => (
    // Schedule doesn't change if:
    // - The defaultAdminDelay was reduced to a value such that added to the block.timestamp is equal to previous schedule
    e.block.timestamp + defaultAdminDelay(e) == pendingAdminScheduleBefore
  ), "pending admin stays the same if a default admin transfer is begun on accepted edge cases";

  // Pending delay
  address pendingDelayBefore = pendingDelay_(e);
  uint48 pendingDelayScheduleBefore = pendingDelaySchedule_(e);

  changeDefaultAdminDelay(e, newDelay);

  address pendingDelayAfter = pendingDelay_(e);
  uint48 pendingDelayScheduleAfter = pendingDelaySchedule_(e);

  assert (
    pendingDelayScheduleBefore != pendingDelayScheduleAfter &&
    pendingDelayBefore == pendingDelayAfter
  ) => newDelay == pendingDelayBefore || pendingDelayBefore == 0, "pending delay stays the same if the new delay set is the same";

  assert (
    pendingDelayBefore != pendingDelayAfter &&
    pendingDelayScheduleBefore == pendingDelayScheduleAfter
  ) => (
    increasingDelaySchedule(e, newDelay) == pendingDelayScheduleBefore ||
    decreasingDelaySchedule(e, newDelay) == pendingDelayScheduleBefore
  ), "pending delay stays the same if a default admin transfer is begun on accepted edge cases";
}
