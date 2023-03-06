const async = require('async')

const database = require('./database')

const checkFields = {
  status: 'Status',
  measure: 'Maßnahme'
}

module.exports = function checkChanges (list, programm, callback) {
  const ts = new Date().toISOString()
  const year = list[0].year

  async.eachSeries(list, (entry, done) => {
    const results = programm.find({
      ort: { $eq: entry.ort },
      year: { $eq: entry.year }
    })

    if (results.length) {
      if (results.length > 1) {
	console.log('duplicate', results.map(r => r.nid))
      }

      let changed = false
      results.forEach(e => e.found = true)
      e = results[0]

      if (e.status != entry.status) {
        e.lastChange = ts
	changed = true
      }

      for (const field in checkFields) {
	if (e[field] != entry[field]) {
	  e.log.push(ts.substr(0, 10) + ' ' + checkFields[field] + ' geändert: ' + e[field] + ' -> ' + entry[field])
	  e[field] = entry[field]
	  console.log('CHANGE', year, entry[field], entry.ort, entry.status)
	  changed = true
	}
      }

      if (changed) {
        programm.update(e)
        database.update(e, done)
      } else {
        done()
      }
    } else {
      entry.found = true
      entry.created = ts
      entry.log = [
        ts.substr(0, 10) + ' gefunden (' + entry.status + ')'
      ]

      if (entry.status !== 'in Planung') {
        entry.lastChange = ts
      }

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
