import { ethers } from 'ethers';
import { MAX_UINT64 } from './constants';
import { upgradeableSlot } from './storage';

export function buildBaseRoles() {
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

export const formatAccess = access => [access[0], access[1].toString()];

export const MINSETBACK = 432000n; // time.duration.days(5);
export const EXPIRATION = 604800n; // time.duration.weeks(1);

export const EXECUTION_ID_STORAGE_SLOT = await upgradeableSlot('AccessManager', 3n);
export const CONSUMING_SCHEDULE_STORAGE_SLOT = await upgradeableSlot('AccessManaged', 0n);

/**
 * @requires this.{manager, caller, target, calldata}
 */
export async function prepareOperation(manager, { caller, target, calldata, delay }) {
  const scheduledAt = (await this.helpers.time.clock.timestamp()) + 1n;
  await this.helpers.time.increaseTo.timestamp(scheduledAt, false); // Fix next block timestamp for predictability

  return {
    schedule: () => manager.connect(caller).schedule(target, calldata, scheduledAt + delay),
    scheduledAt,
    operationId: hashOperation(caller, target, calldata),
  };
}

const lazyGetAddress = addressable => addressable.address ?? addressable.target ?? addressable;

export const hashOperation = (caller, target, data) =>
  ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'bytes'],
      [lazyGetAddress(caller), lazyGetAddress(target), data],
    ),
  );
