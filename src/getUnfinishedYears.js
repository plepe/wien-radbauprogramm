module.exports = function getUnfinishedYears (programm, currentYear) {
  const list = programm.find({
    status: { $ne: 'fertiggestellt' },
    year: { $lt: currentYear }
  })

  let years = list.map(e => e.year)
  years = [...new Set(years)]

  return years
}
