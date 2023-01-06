const loadBauprogramm = require('./src/loadBauprogramm')
const LokiJS = require('lokijs')

const db = new LokiJS('data/data.db', {
  autoload: true,
  autoloadCallback: init,
  autosave: true
})

function init () {
  let programm = db.getCollection('entries')
  if (programm === null) {
    programm = db.addCollection('entries')
  }

  const ts = new Date().toISOString()

  loadBauprogramm('https://www.wien.gv.at/verkehr/radfahren/bauen/programm/',
    (err, list) => {
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
            e.log.push({ ts, status: entry.status })
          }

          programm.update(e)
        } else {
          entry.ts = ts
          entry.created = ts
          entry.log = [
            { ts, status: entry.status }
          ]

          programm.insert(entry)
        }
      })

      const results = programm.find({
        year: { $eq: 2022 },
        ts: { $lt: ts },
        status: { $ne: 'verschwunden' }
      })

      results.forEach(entry => {
        entry.status = 'verschwunden'
        entry.log.push({ ts, status: 'verschwunden' })
        entry.ts = ts

        programm.update(entry)
      })
    }
  )
}
