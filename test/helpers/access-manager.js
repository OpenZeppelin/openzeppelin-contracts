let CONSUMING_SCHEDULE_STORAGE_SLOT = 0n;
try {
  // Try to get the artifact paths, will throw if it doesn't exist
  artifacts._getArtifactPathSync('AccessManagedUpgradeable');

  // ERC-7201 namespace location for AccessManaged
  CONSUMING_SCHEDULE_STORAGE_SLOT += 0xf3177357ab46d8af007ab3fdb9af81da189e1068fefdc0073dca88a2cab40a00n;
} catch (_) {
  // eslint-disable-next-line no-empty
}

module.exports = {
  CONSUMING_SCHEDULE_STORAGE_SLOT,
};
