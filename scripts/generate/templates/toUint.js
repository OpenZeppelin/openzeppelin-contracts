module.exports = length => [
    `    /**`,
    `     * @dev Converts a signed int${length} into an unsigned uint${length}.`,
    `     *`,
    `     * Requirements:`,
    `     *`,
    `     * - input must be greater than or equal to 0.`,
    `     */`,
    `    function toUint${length}(int${length} value) internal pure returns (uint${length}) {`,
    `        require(value >= 0, "SafeCast: value must be positive");`,
    `        return uint${length}(value);`,
    `    }`,
].join('\n');