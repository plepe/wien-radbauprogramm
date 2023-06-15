const async = require('async')
const DrupalRest = require('drupal-rest')
const csvtojson = require('csvtojson')

const config = require('./config.json')

const drupal = new DrupalRest(config.drupal)

const mapping = {
  count: 'field_anzahl_bauprojekte',
  countDone: 'field_anzahl_abgeschlossen',
  lengths: 'field_laenge_aller_projekte',
  allHaveGeo: 'field_alle_projekte_geometrie',
}

drupal.login(err => {
  if (err) { return console.error(err) }
  run()
})

function run () {
  async.parallel({
    login: (done) => {
      drupal.login(err => done(err))
    },
    projekte: (done) => {
      const data = []

      drupal.get('/bauprogramm.csv',
        (err, body) => csvtojson({})
          .fromString(body)
          .subscribe(line => data.push(line))
          .on('done', () => done(null, data))
      )
    },
    programme: (done) => {
      drupal.loadRestExport('/rest/taxonomy?type=bauprogramm', { paginated: true }, done)
    }
  }, (err, { projekte, programme }) => {
    const value = {
      count: {},
      allHaveGeo: {},
      lengths: {},
      countDone: {}
    }

    projekte.forEach(projekt => {
      const year = projekt.Jahr
      if (!(year in value.count)) {
        value.count[year] = 0
        value.lengths[year] = 0
        value.allHaveGeo[year] = true
        value.countDone[year] = 0
      }

      value.count[year]++
      if (projekt.Shape) {
        value.lengths[year] += parseFloat(projekt['Länge'])
      } else {
        value.allHaveGeo[year] = false
      }
      if (['fertiggestellt', 'verschwunden', 'verschoben'].includes(projekt.Status)) {
        value.countDone[year]++
      }
    })

    async.eachSeries(Object.keys(value.count), (year, done) => {
      year = parseInt(year)
      let programm = programme.filter(p => p.field_jahr[0].value === year)
      if (programm.length !== 1) {
        console.error('No programm for year', year, 'found')
        return
      }

      programm = programm[0]

      update = {}
      for (const k in mapping) {
        if (!programm[mapping[k]].length || value[k][year] !== programm[mapping[k]][0].value) {
          update[mapping[k]] = [{ value: value[k][year] }]
        }
      }

      if (Object.keys(update).length) {
        console.log(programm.field_jahr[0].value + ' update ' + programm.tid[0].value + ': ' + Object.keys(update).join(', '))
        update.vid = programm.vid
        drupal.taxonomySave(programm.tid[0].value, update, done)
      } else {
        // console.log(programm.field_jahr[0].value + ' no changes ' + programm.tid[0].value)
        done()
      }
    })

  })
}
