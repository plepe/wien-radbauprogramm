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
      e.found = true
      if (e.status != entry.status) {
        e.lastChange = ts
        e.log.push(ts.substr(0, 10) + ' ' + e.status + '-> ' + entry.status)
        e.status = entry.status
        console.log('CHANGE', year, entry.ort, entry.status)
        programm.update(e)
        database.update(e, done)
      } else {
        done()
      }
    } else {
      entry.found = true
      entry.created = ts
      entry.log = [
        ts.substr(0, 10) + ' gefunden'
      ]

      console.log('NEW', year, entry.ort, entry.status)
      programm.insert(entry)
      database.update(entry, done)
    }
  }, (err) => {
    if (err) { return callback(err) }

    const results = programm.find({
      year: { $eq: year },
      found: { $ne: true },
      status: { $ne: 'verschwunden' }
    })

    async.each(results, (entry, done) => {
      e.log.push(ts.substr(0, 10) + ' ' + entry.status + '-> verschwunden')
      entry.status = 'verschwunden'
      entry.lastChange = ts

      console.log('GONE', year, entry.ort, entry.status)
      programm.update(entry)
      database.update(entry, done)
    }, callback)
  })
}
