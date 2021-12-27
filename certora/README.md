# Running the certora verification tool

These instructions detail the process for running CVT on the OpenZeppelin (Wizard/Governor) contracts.

Documentation for CVT and the specification language are available
[here](https://certora.atlassian.net/wiki/spaces/CPD/overview)

## Running the verification

The scripts in the `certora/scripts` directory are used to submit verification
jobs to the Certora verification service. After the job is complete, the results will be available on
[the Certora portal](https://vaas-stg.certora.com/).

These scripts should be run from the root directory; for example by running

```
sh certora/scripts/verifyAll.sh <meaningful comment>
```

The most important of these is `verifyAll.sh`, which checks
all of the harnessed contracts (`certora/harness/Wizard*.sol`) against all of
the specifications (`certora/spec/*.spec`).

The other scripts run a subset of the specifications or the contracts.  You can
verify different contracts or specifications by changing the `--verify` option,
and you can run a single rule or method with the `--rule` or `--method` option.

For example, to verify the `WizardFirstPriority` contract against the
`GovernorCountingSimple` specification, you could change the `--verify` line of
the `WizardControlFirstPriortity.sh` script to:

```
--verify WizardFirstPriority:certora/specs/GovernorCountingSimple.spec \
```

## Adapting to changes in the contracts

Some of our rules require the code to be simplified in various ways. Our
primary tool for performing these simplifications is to run verification on a
contract that extends the original contracts and overrides some of the methods.
These "harness" contracts can be found in the `certora/harness` directory.

This pattern does require some modifications to the original code: some methods
need to be made virtual or public, for example. These changes are handled by
applying a patch to the code before verification.

When one of the `verify` scripts is executed, it first applies the patch file
`certora/applyHarness.patch` to the `contracts` directory, placing the output
in the `certora/munged` directory. We then verify the contracts in the
`certora/munged` directory.

If the original contracts change, it is possible to create a conflict with the
patch. In this case, the verify scripts will report an error message and output
rejected changes in the `munged` directory. After merging the changes, run
`make record` in the `certora` directory; this will regenerate the patch file,
which can then be checked into git.
