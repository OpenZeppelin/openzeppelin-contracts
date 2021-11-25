# Running the certora verification tool

These instructions detail the process for running CVT on the OpenZeppelin (Wizard/Governor) contracts.

Documentation for CVT and the specification language are available
[here](https://certora.atlassian.net/wiki/spaces/CPD/overview)

## Running the verification

The scripts in the `certora/scripts` directory are used to submit verification
jobs to the Certora verification service. These scripts should be run from the
root directory; for example by running

```
sh certora/scripts/WizardFirstPriority.sh <meaningful comment>
```

After the job is complete, the results will be available on
[the Certora portal](https://vaas-stg.certora.com/).

The `verifyAll` script runs all spec files agains all contracts in the `certora/harness` that start with `Wizard` meaning that a contract generated in [wizard](https://wizard.openzeppelin.com/#governor). If you want to verify new wizard's instance you also need to harness this contract. We don't recommend to do it because a list of harnesses may go beyond wizard's contract. Moreover, the set of setting to run the Certora verification service may vary. The main goal of this script is to run all specs written by the team against all contracts properly harnessed.

The `WizardFirstPriority` and `WizardFirstTry` scripts run one of the scripts for the corresponding contract. In order to run another spec you should change spec file name `<specName>` in the script (flag `--verify`):

```
--verify WizardFirstPriority:certora/specs/<specName>.spec \
```

for example:

```
--verify WizardFirstPriority:certora/specs/GovernorCountingSimple.spec \
```


MENTION TIMEOUTS ISSUES


## Adapting to changes

Some of our rules require the code to be simplified in various ways. Our
primary tool for performing these simplifications is to run verification on a
contract that extends the original contracts and overrides some of the methods.
These "harness" contracts can be found in the `certora/harness` directory.

This pattern does require some modifications to the original code: some methods
need to be made virtual or public, for example. These changes are handled by
applying a patch to the code before verification.
