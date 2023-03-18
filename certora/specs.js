const product = (...arrays) => arrays.reduce((a, b) => a.flatMap(ai => b.map(bi => [ai, bi].flat())));

module.exports = [].concat(
  // AccessControl
  {
    spec: 'AccessControl',
    contract: 'AccessControlHarness',
    files: ['certora/harnesses/AccessControlHarness.sol'],
  },
  {
    spec: 'Ownable',
    contract: 'OwnableHarness',
    files: ['certora/harnesses/OwnableHarness.sol'],
  },
  {
    spec: 'Ownable2Step',
    contract: 'Ownable2StepHarness',
    files: ['certora/harnesses/Ownable2StepHarness.sol'],
  },
  // Tokens
  {
    spec: 'ERC20',
    contract: 'ERC20PermitHarness',
    files: ['certora/harnesses/ERC20PermitHarness.sol'],
    options: ['--optimistic_loop'],
  },
  {
    spec: 'ERC20FlashMint',
    contract: 'ERC20FlashMintHarness',
    files: ['certora/harnesses/ERC20FlashMintHarness.sol', 'certora/harnesses/ERC3156FlashBorrowerHarness.sol'],
    options: ['--optimistic_loop'],
  },
  {
    spec: 'ERC20Wrapper',
    contract: 'ERC20WrapperHarness',
    files: ['certora/harnesses/ERC20PermitHarness.sol', 'certora/harnesses/ERC20WrapperHarness.sol'],
    options: ['--link ERC20WrapperHarness:_underlying=ERC20PermitHarness', '--optimistic_loop'],
  },
  // Security
  {
    spec: 'Pausable',
    contract: 'PausableHarness',
    files: ['certora/harnesses/PausableHarness.sol'],
  },
  // Proxy
  {
    spec: 'Initializable',
    contract: 'InitializableHarness',
    files: ['certora/harnesses/InitializableHarness.sol'],
  },
  // Governance
  {
    spec: 'TimelockController',
    contract: 'TimelockControllerHarness',
    files: ['certora/harnesses/TimelockControllerHarness.sol'],
    options: ['--optimistic_hashing', '--optimistic_loop'],
  },
  // Governor
  product(
    [
      ...product(['GovernorHarness'], ['GovernorInvariants', 'GovernorBaseRules', 'GovernorChanges', 'GovernorStates']),
      ...product(['GovernorPreventLateHarness'], ['GovernorPreventLateQuorum']),
    ],
    ['ERC20VotesBlocknumberHarness', 'ERC20VotesTimestampHarness'],
  ).map(([contract, spec, token]) => ({
    spec,
    contract,
    files: [
      `certora/harnesses/${contract}.sol`,
      `certora/harnesses/${token}.sol`,
      `certora/harnesses/TimelockControllerHarness.sol`,
    ],
    options: [
      `--link ${contract}:token=${token}`,
      `--link ${contract}:_timelock=TimelockControllerHarness`,
      '--optimistic_hashing',
      '--optimistic_loop',
    ],
  })),
  product(
    ['GovernorHarness'],
    ['GovernorFunctions'],
    ['ERC20VotesBlocknumberHarness', 'ERC20VotesTimestampHarness'],
    ['castVote', 'execute'], // 'propose', 'queue', 'cancel' // these rules timeout/fail
  ).map(([contract, spec, token, fn]) => ({
    spec,
    contract,
    files: [
      `certora/harnesses/${contract}.sol`,
      `certora/harnesses/${token}.sol`,
      `certora/harnesses/TimelockControllerHarness.sol`,
    ],
    options: [
      `--link ${contract}:token=${token}`,
      `--link ${contract}:_timelock=TimelockControllerHarness`,
      '--optimistic_hashing',
      '--optimistic_loop',
      '--rules',
      ...['liveness', 'effect', 'sideeffect'].map(kind => `${fn}_${kind}`),
    ],
  })),
);
