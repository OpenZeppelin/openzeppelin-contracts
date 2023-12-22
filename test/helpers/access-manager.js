const { ethers } = require('hardhat');
const { MAX_UINT64 } = require('./constants');
const { namespaceSlot } = require('./namespaced-storage');
const { bigint: time } = require('./time');

function buildBaseRoles() {
  const roles = {
    ADMIN: {
      id: 0n,
    },
    SOME_ADMIN: {
      id: 17n,
    },
    SOME_GUARDIAN: {
      id: 35n,
    },
    SOME: {
      id: 42n,
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
  const scheduledAt = (await time.clock.timestamp()) + 1n;
  await time.increaseTo.timestamp(scheduledAt, false); // Fix next block timestamp for predictability

  return {
    schedule: () => manager.connect(caller).schedule(target, calldata, scheduledAt + delay),
    scheduledAt,
    operationId: hashOperation(caller, target, calldata),
  };
}

const lazyGetAddress = addressable => addressable.address ?? addressable.target ?? addressable;

const hashOperation = (caller, target, data) =>
  ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'bytes'],
      [lazyGetAddress(caller), lazyGetAddress(target), data],
    ),
  );

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
