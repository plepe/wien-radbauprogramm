const LokiJS = require('lokijs')
const async = require('async')
const range = require('fill-range')

const loadBauprogramm = require('./src/loadBauprogramm')
const database = require('./src/database')
const checkChanges = require('./src/checkChanges')
const getUnfinishedYears = require('./src/getUnfinishedYears')

const firstYear = 2003

database.load({}, (err, _programm) => {
  programm = _programm

  init()
})

function init () {
  loadBauprogramm({},
    (err, list) => {
      if (err) {
        console.error(err)
        close(1)
      }

      const year = list[0].year
      checkChanges(list, programm,
        () => {
          const years = database.firstRun ? range(firstYear, year) : getUnfinishedYears(programm, year)
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
  database.close({}, (err) => {
    if (err) {
      console.error(err)
      exitCode = 1
    }

    process.exit(exitCode)
  })
}
