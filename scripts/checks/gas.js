#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function zip(...args) {
    return Array(Math.max(...args.map(arg => arg.length))).fill(null).map((_, i) => args.map(arg => arg[i]));
}

function unique(array, op = x => x) {
    return array.filter((obj, i) => array.findIndex(entry => op(obj) === op(entry)) === i);
}

class Report {
    static load(filepath) {
        const raw   = fs.readFileSync(filepath).toString();
        const clean = raw.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ''); // see https://stackoverflow.com/a/29497680/1503898
        return this.parse(clean);
    }

    static parse(data) {
        const report = {}
        for (const method of data.matchAll(/([\·\|]\s+([a-zA-Z0-9\.\-]+)\s+){7}/g)) {
            const params   = method[0].matchAll(/([a-zA-Z0-9\.\-]+)/g);
            const contract = params.next().value[0];
            const name     = params.next().value[0];
            const min      = Number(params.next().value[0]);
            const max      = Number(params.next().value[0]);
            const avg      = Number(params.next().value[0]);
            report[contract] ||= [];
            report[contract].push({ name, min, max, avg });
        }
        return report;
    }

    static compare(ref, update) {
        for (const contract in update) {
            if (!ref[contract]) {
                continue;
            }

            for (const [ current, previous ] of unique(update[contract].map(({ name }) => name)).flatMap(name => zip(
                update[contract].filter(entry => entry.name == name),
                ref[contract].filter(entry => entry.name == name),
            ))) {
                if (!current || !previous) continue;
                console.log([
                    '| ',
                    contract.padEnd(40),
                    ' | ',
                    current.name.padEnd(20),
                    ' | ',
                    ( isNaN(previous.min) || isNaN(current.min) ? '-' : current.min                                                          ).toString().padStart(10),
                    ( isNaN(previous.min) || isNaN(current.min) ? '-' : current.min - previous.min                                           ).toString().padStart(10),
                    ( isNaN(previous.min) || isNaN(current.min) ? '-' : (100 * (current.min - previous.min) / previous.min).toFixed(2) + "%" ).toString().padStart(10),
                    ' | ',
                    ( isNaN(previous.max) || isNaN(current.max) ? '-' : current.max                                                          ).toString().padStart(10),
                    ( isNaN(previous.max) || isNaN(current.max) ? '-' : current.max - previous.max                                           ).toString().padStart(10),
                    ( isNaN(previous.max) || isNaN(current.max) ? '-' : (100 * (current.max - previous.max) / previous.max).toFixed(2) + "%" ).toString().padStart(10),
                    ' | ',
                    ( isNaN(previous.avg) || isNaN(current.avg) ? '-' : current.avg                                                          ).toString().padStart(10),
                    ( isNaN(previous.avg) || isNaN(current.avg) ? '-' : current.avg - previous.avg                                           ).toString().padStart(10),
                    ( isNaN(previous.avg) || isNaN(current.avg) ? '-' : (100 * (current.avg - previous.avg) / previous.avg).toFixed(2) + "%" ).toString().padStart(10),
                    ' |',
                ].join(''))
            }
        }
    }
}





Report.compare(
    Report.load(path.resolve('./master.gasreport.txt')),
    Report.load(path.resolve('./local.gasreport.txt')),
);