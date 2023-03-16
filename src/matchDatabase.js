const async = require('async')
const stringSimilarity = require('string-similarity')

const database = require('./database')

const checkFields = {
  status: 'Status',
  measure: 'Maßnahme'
}

const ts = new Date().toISOString()

module.exports = function matchDatabase (options, bauprogramm, entries, callback) {
  const newProjects = []
  const results = []
  const found = {}

  bauprogramm.forEach((bauprojekt) => {
    const r = entries.find({
      ort: { $eq: bauprojekt.ort },
      year: { $eq: bauprojekt.year }
    })

    if (r.length) {
      if (r.length > 1) {
        console.log('duplicate', r.map(r1 => r1.nid))
      }

      results.push({
        bauprojekt,
        eintrag: r[0]
      })

      found[r[0].$loki] = true
    } else {
      newProjects.push(bauprojekt)
    }
  })

  vanishedOptions = {}
  if (!options.year) {
    vanishedOptions.year = bauprogramm[0].year
  } else if (options.year !== 'all') {
    vanishedOptions.year = parseInt(options.year)
  }

  let vanished = entries
    .find(vanishedOptions)
    .filter(entry => !(entry.$loki in found))

  vanished.forEach(entry => {
    if (newProjects.length) {
      const matches = stringSimilarity.findBestMatch(entry.ort, newProjects.map(p => p.ort))
      if (matches.bestMatch.rating > 0.9) {
        results.push({
          bauprojekt: newProjects[matches.bestMatchIndex],
          eintrag: entry,
          similarity: matches.bestMatch.rating
        })

        newProjects.splice(matches.bestMatchIndex, 1)
        return
      }
    }

    results.push({
      eintrag: entry
    })
  })

  newProjects.forEach(bauprojekt => results.push({ bauprojekt }))

  callback(null, results)
}
