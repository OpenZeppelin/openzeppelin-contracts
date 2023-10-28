const {
  bigint: { MAX_UINT64 },
} = require('./constants');
const { namespaceSlot } = require('./namespaced-storage');
const {
  time: { setNextBlockTimestamp },
} = require('@nomicfoundation/hardhat-network-helpers');
const { bigint: time } = require('./time');
const { keccak256, AbiCoder } = require('ethers');

function buildBaseRoles() {
  const roles = {
    ADMIN: {
      id: BigInt(0),
    },
    SOME_ADMIN: {
      id: BigInt(17),
    },
    SOME_GUARDIAN: {
      id: BigInt(35),
    },
    SOME: {
      id: BigInt(42),
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
async function prepareOperation(manager, { caller, target, calldata, delay }) {
  const timestamp = await time.clock.timestamp();
  const scheduledAt = timestamp + 1n;
  await setNextBlockTimestamp(scheduledAt); // Fix next block timestamp for predictability

  return {
    schedule: () => manager.connect(caller).schedule(target, calldata, scheduledAt + delay),
    scheduledAt,
    operationId: hashOperation(caller.address, target, calldata),
  };
}

const hashOperation = (caller, target, data) =>
  keccak256(AbiCoder.defaultAbiCoder().encode(['address', 'address', 'bytes'], [caller, target, data]));

module.exports = {
  buildBaseRoles,
  formatAccess,
  MINSETBACK,
  EXPIRATION,
  EXECUTION_ID_STORAGE_SLOT,
  CONSUMING_SCHEDULE_STORAGE_SLOT,
  prepareOperation,
  hashOperation,
};
