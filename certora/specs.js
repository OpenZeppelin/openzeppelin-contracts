/// This helper will be handy when we want to do cross product. Ex: all governor specs on all variations of the clock mode.
const product = (...arrays) => arrays.reduce((a, b) => a.flatMap(ai => b.map(bi => [ai, bi].flat())));

module.exports = [
  {
    "spec": "AccessControl",
    "contract": "AccessControlHarness",
    "files": ["certora/harnesses/AccessControlHarness.sol"]
  },
  {
    "spec": "Ownable",
    "contract": "OwnableHarness",
    "files": ["certora/harnesses/OwnableHarness.sol"]
  },
  {
    "spec": "Ownable2Step",
    "contract": "Ownable2StepHarness",
    "files": ["certora/harnesses/Ownable2StepHarness.sol"]
  },
  {
    "spec": "ERC20",
    "contract": "ERC20PermitHarness",
    "files": ["certora/harnesses/ERC20PermitHarness.sol"],
    "options": ["--optimistic_loop"]
  },
  {
    "spec": "ERC20FlashMint",
    "contract": "ERC20FlashMintHarness",
    "files": [
      "certora/harnesses/ERC20FlashMintHarness.sol",
      "certora/harnesses/ERC3156FlashBorrowerHarness.sol"
    ],
    "options": ["--optimistic_loop"]
  },
  {
    "spec": "ERC20Wrapper",
    "contract": "ERC20WrapperHarness",
    "files": [
      "certora/harnesses/ERC20PermitHarness.sol",
      "certora/harnesses/ERC20WrapperHarness.sol"
    ],
    "options": [
      "--link ERC20WrapperHarness:_underlying=ERC20PermitHarness",
      "--optimistic_loop"
    ]
  },
  {
    "spec": "Initializable",
    "contract": "InitializableHarness",
    "files": ["certora/harnesses/InitializableHarness.sol"]
  },
  ...[ "GovernorBase", "GovernorInvariants", "GovernorStates", "GovernorFunctions" ].map(spec => ({
    spec,
    "contract": "GovernorHarness",
    "files": [
      "certora/harnesses/GovernorHarness.sol",
      "certora/harnesses/ERC20VotesHarness.sol"
    ],
    "options": [
      "--link GovernorHarness:token=ERC20VotesHarness",
      "--optimistic_loop",
      "--optimistic_hashing"
    ]
  }))
];