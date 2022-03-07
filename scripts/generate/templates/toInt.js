module.exports = length => [
  '    /**',
  `     * @dev Converts an unsigned uint${length} into a signed int${length}.`,
  '     *',
  '     * Requirements:',
  '     *',
  `     * - input must be less than or equal to maxInt${length}.`,
  '     */',
  `    function toInt${length}(uint${length} value) internal pure returns (int${length}) {`,
  `        // Note: Unsafe cast below is okay because \`type(int${length}).max\` is guaranteed to be positive`,
  `        require(value <= uint${length}(type(int${length}).max), "SafeCast: value doesn't fit in an int${length}");`,
  `        return int${length}(value);`,
  '    }',
].join('\n');
