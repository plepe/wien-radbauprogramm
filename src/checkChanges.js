const async = require('async')

const database = require('./database')

module.exports = function checkChanges (list, programm, callback) {
  const ts = new Date().toISOString()
  const year = list[0].year

  async.eachSeries(list, (entry, done) => {
    const results = programm.find({
      ort: { $eq: entry.ort },
      year: { $eq: entry.year }
    })

    if (results.length) {
      e = results[0]
      e.ts = ts
      if (e.status != entry.status) {
        e.lastChange = ts
        e.log.push(ts.substr(0, 10) + ' ' + e.status + '-> ' + entry.status)
        e.status = entry.status
        console.log('CHANGE', year, entry.ort, entry.status)
      }

      programm.update(e)
      database.update(e, done)
    } else {
      entry.ts = ts
      entry.created = ts
      entry.log = [
        ts.substr(0, 10) + ' gefunden'
      ]

      console.log('NEW', year, entry.ort, entry.status)
      programm.insert(entry)
      database.update(entry, done)
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
