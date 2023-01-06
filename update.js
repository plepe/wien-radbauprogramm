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
          entry = results[0]
          entry.ts = ts

          programm.update(entry)
        } else {
          entry.ts = ts
          entry.created = ts

          programm.insert(entry)
        }
      })
    }
  )
}
