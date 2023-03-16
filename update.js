const LokiJS = require('lokijs')
const async = require('async')
const range = require('range').range

const loadBauprogramm = require('./src/loadBauprogramm')
const drupal = require('./src/drupal')
const checkChanges = require('./src/checkChanges')
const getUnfinishedYears = require('./src/getUnfinishedYears')

const firstYear = 2003

// const db = new LokiJS('data/data.db', {
//  autoload: true,
//  autoloadCallback: init,
//  autosave: true
// })
const db = new LokiJS()
drupal.load(db, init)

function init () {
  let firstRun = false
  let programm = db.getCollection('entries')
  if (programm === null) {
    firstRun = true
    programm = db.addCollection('entries')
  }

  loadBauprogramm({},
    (err, list) => {
      if (err) {
        console.error(err)
        close(1)
      }

      const year = list[0].year
      checkChanges(list, programm,
        () => {
          const years = firstRun ? range(firstYear, year) : getUnfinishedYears(programm, year)
          async.eachSeries(years,
            (year, done) => {
              loadBauprogramm({ year },
                (err, list) => {
                  if (err) { return done(err) }
                  checkChanges(list, programm, done)
                }
              )
            },
            (err) => {
              if (err) {
                console.error(err)
                close(1)
              }

              close(0)
            }
          )
        }
      )
    }
  )
}

function close (exitCode) {
  db.close((err) => {
    if (err) {
      console.error(err)
      exitCode = 1
    }

    process.exit(exitCode)
  })
}
