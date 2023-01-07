module.exports = function checkChanges (list, programm, callback) {
  const ts = new Date().toISOString()
  const year = list[0].year

  list.forEach(entry => {
    const results = programm.find({
      ort: { $eq: entry.ort },
      year: { $eq: entry.year }
    })

    if (results.length) {
      e = results[0]
      e.ts = ts
      if (e.status != entry.status) {
        e.status = entry.status
        e.lastChange = ts
        e.log.push({ ts, status: entry.status })
        console.log('CHANGE', year, entry.ort, entry.status)
      }

      programm.update(e)
    } else {
      entry.ts = ts
      entry.created = ts
      entry.log = [
        { ts, status: entry.status }
      ]

      console.log('NEW', year, entry.ort, entry.status)
      programm.insert(entry)
    }
  })

  const results = programm.find({
    year: { $eq: year },
    ts: { $lt: ts },
    status: { $ne: 'verschwunden' }
  })

  results.forEach(entry => {
    entry.status = 'verschwunden'
    entry.log.push({ ts, status: 'verschwunden' })
    entry.ts = ts
    entry.lastChange = ts

    programm.update(entry)
  })

  callback()
}
