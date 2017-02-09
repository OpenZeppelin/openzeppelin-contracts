module.exports = s => {
  return new Promise(resolve => {
    setTimeout(() => resolve(), s * 1000 + 600) // 600ms breathing room for testrpc to sync
  })
}
