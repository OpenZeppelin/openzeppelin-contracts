const { time } = require('@openzeppelin/test-helpers');
const { MAX_UINT64 } = require('./constants');
const { namespaceSlot } = require('./namespaced-storage');
const {
  time: { setNextBlockTimestamp },
} = require('@nomicfoundation/hardhat-network-helpers');

function buildBaseRoles() {
  const roles = {
    ADMIN: {
      id: web3.utils.toBN(0),
    },
    SOME_ADMIN: {
      id: web3.utils.toBN(17),
    },
    SOME_GUARDIAN: {
      id: web3.utils.toBN(35),
    },
    SOME: {
      id: web3.utils.toBN(42),
    },
    PUBLIC: {
      id: MAX_UINT64,
    },
  };

  // Names
  Object.entries(roles).forEach(([name, role]) => (role.name = name));

  // Defaults
  for (const role of Object.keys(roles)) {
    roles[role].admin = roles.ADMIN;
    roles[role].guardian = roles.ADMIN;
  }

  // Admins
  roles.SOME.admin = roles.SOME_ADMIN;

  // Guardians
  roles.SOME.guardian = roles.SOME_GUARDIAN;

  return roles;
}

const formatAccess = access => [access[0], access[1].toString()];

const MINSETBACK = time.duration.days(5);
const EXPIRATION = time.duration.weeks(1);

const EXECUTION_ID_STORAGE_SLOT = namespaceSlot('AccessManager', 3n);
const CONSUMING_SCHEDULE_STORAGE_SLOT = namespaceSlot('AccessManaged', 0n);

/**
 * @requires this.{manager, caller, target, calldata}
 */
async function scheduleOperation(manager, { caller, target, calldata, delay }) {
  const timestamp = await time.latest();
  const scheduledAt = timestamp.addn(1);
  await setNextBlockTimestamp(scheduledAt); // Fix next block timestamp for predictability
  const { receipt } = await manager.schedule(target, calldata, scheduledAt.add(delay), {
    from: caller,
  });

  return {
    receipt,
    scheduledAt,
    operationId: hashOperation(caller, target, calldata),
  };
}

const hashOperation = (caller, target, data) =>
  web3.utils.keccak256(web3.eth.abi.encodeParameters(['address', 'address', 'bytes'], [caller, target, data]));

module.exports = {
  buildBaseRoles,
  formatAccess,
  MINSETBACK,
  EXPIRATION,
  EXECUTION_ID_STORAGE_SLOT,
  CONSUMING_SCHEDULE_STORAGE_SLOT,
  scheduleOperation,
  hashOperation,
};
