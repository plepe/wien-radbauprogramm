const LokiJS = require('lokijs')

const loadBauprogramm = require('./src/loadBauprogramm')
const checkChanges = require('./src/checkChanges')

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

  loadBauprogramm('https://www.wien.gv.at/verkehr/radfahren/bauen/programm/',
    (err, list) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }

      checkChanges(list, programm,
        () => {
          process.exit(0)
        }
      )
    }
  )
}
