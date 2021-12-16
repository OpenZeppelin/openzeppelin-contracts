const fs = require('fs');
const git = require('gift');
const semver = require('semver');

const { version } = require('../../package.json');

function check(error, message) {
    if (error) {
        console.error(message ?? error);
        process.exit(1);
    }
}

const repo = git('.');

repo.git('status --porcelain -uno contracts/**/*.sol', (error, status) => {
    check(error);
    check(!!status, 'Contracts directory is not clean');

    repo.tags((error, tags) => {
        check(error);

        const [ tag ] = tags
            .map(({ name }) => name)
            .filter(semver.valid)
            .sort(semver.rcompare);

        repo.diff('master', tag, (error, diffs) => {
            check(error);

            diffs
                .filter(({ b_path: path }) => path.startsWith('contracts/'))
                .filter(({ b_path: path }) => !path.startsWith('contracts/mocks'))
                .filter(({ b_path: path }) => path.endsWith('.sol'))
                .forEach(({ b_path: path }) => {
                    const current = fs.readFileSync(path, 'utf8');
                    const updated = current.replace(
                        /(\/\/ SPDX-License-Identifier:.*)$(\n\/\/ OpenZeppelin Contracts v.*$)?/m,
                        `$1\n// Last updated in OpenZeppelin Contracts v${version} (${path.replace('contracts/', '')})`,
                    );
                    fs.writeFileSync(path, updated);
                });

            repo.git('add --update contracts', (error) => {
                check(error);
            });
        });
    });
});
