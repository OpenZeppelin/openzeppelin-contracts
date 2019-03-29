after(async () => {
  if (process.env.SOLIDITY_COVERAGE) {
    console.log('Writing coverage report.')
    await global.coverageSubprovider.writeCoverageAsync();
  }
});
