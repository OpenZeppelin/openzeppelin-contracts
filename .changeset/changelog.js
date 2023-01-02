const { default: changelogGithub } = require('@changesets/changelog-github');

const getReleaseLine = async (changeset, _type, options) => {
  const releaseLine = await changelogGithub.getReleaseLine(changeset, _type, options);

  return releaseLine;
};

const getDependencyReleaseLine = async (changesets, dependenciesUpdated, options) => {
  const dependencyReleaseLine = await changelogGithub.getDependencyReleaseLine(
    changesets,
    dependenciesUpdated,
    options,
  );

  return dependencyReleaseLine;
};

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine,
};
