const { time } = require('@openzeppelin/test-helpers');
const { MAX_UINT64 } = require('./constants');
const { artifacts } = require('hardhat');

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

let EXECUTION_ID_STORAGE_SLOT = 3n;
let CONSUMING_SCHEDULE_STORAGE_SLOT = 0n;
try {
  // Try to get the artifact paths, will throw if it doesn't exist
  artifacts._getArtifactPathSync('AccessManagerUpgradeable');
  artifacts._getArtifactPathSync('AccessManagedUpgradeable');

  // ERC-7201 namespace location for AccessManager
  EXECUTION_ID_STORAGE_SLOT += 0x40c6c8c28789853c7efd823ab20824bbd71718a8a5915e855f6f288c9a26ad00n;
  // ERC-7201 namespace location for AccessManaged
  CONSUMING_SCHEDULE_STORAGE_SLOT += 0xf3177357ab46d8af007ab3fdb9af81da189e1068fefdc0073dca88a2cab40a00n;
} catch (_) {
  // eslint-disable-next-line no-empty
}

module.exports = {
  buildBaseRoles,
  formatAccess,
  MINSETBACK,
  EXPIRATION,
  EXECUTION_ID_STORAGE_SLOT,
  CONSUMING_SCHEDULE_STORAGE_SLOT,
};
