const async = require('async')
const stringSimilarity = require('string-similarity')

const database = require('./database')

const checkFields = {
  status: 'Status',
  measure: 'Maßnahme'
}

const ts = new Date().toISOString()

module.exports = function checkChanges (list, programm, callback) {
  const year = list[0].year
  const newProjects = []

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
      results.forEach(e => {
        e.found = true
      })
      const current = results[0]

      if (compareValues(current, entry, year)) {
        changed = true
      }

      if (changed) {
        programm.update(current)
        database.update(current, done)
      } else {
        done()
      }
    } else {
      newProjects.push(entry)
      done()
    }
  }, (err) => {
    if (err) { return callback(err) }

    const results = programm.find({
      year: { $eq: year },
      found: { $ne: true },
      status: { $ne: 'verschwunden' }
    })

    async.waterfall([
      // vanished
      (done) => async.eachSeries(results, (entry, done) => {
        // try to find a new project with a similar name
        if (newProjects.length) {
          const matches = stringSimilarity.findBestMatch(entry.ort, newProjects.map(p => p.ort))
          if (matches.bestMatch.rating > 0.9) {
            const newProject = newProjects[matches.bestMatchIndex]
            newProjects.splice(matches.bestMatchIndex, 1)
            entry.log.push(ts.substr(0, 10) + ' Ort geändert')
            entry.ort = newProject.ort
            console.log('RENAMED', year, entry.ort, 'rating=' + matches.bestMatch.rating)

            compareValues(entry, newProject, year)

            programm.update(entry)
            database.update(entry, done)
            return
          }
        }

        entry.log.push(ts.substr(0, 10) + ' Status geändert: ' + entry.status + ' -> verschwunden')
        entry.status = 'verschwunden'
        entry.lastChange = ts

        console.log('GONE', year, entry.ort, entry.status)
        programm.update(entry)
        database.update(entry, done)
      }, done),
      // newProjects
      (done) => async.eachSeries(newProjects, (entry, done) => {
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
      }, done)
    ], callback)
  })
}

function compareValues (current, entry, year) {
  let changed = false

  if (current.status !== entry.status) {
    current.lastChange = ts
    changed = true
  }

  for (const field in checkFields) {
    if (current[field] !== entry[field]) {
      current.log.push(ts.substr(0, 10) + ' ' + checkFields[field] + ' geändert: ' + current[field] + ' -> ' + entry[field])
      current[field] = entry[field]
      console.log('CHANGE', year, entry[field], entry.ort, entry.status)
      changed = true
    }
  }

  return changed
}
