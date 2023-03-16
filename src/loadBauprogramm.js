const JSDOM = require('jsdom').JSDOM
const iconv = require('iconv-lite')
const async = require('async')
const range = require('fill-range')

const strasseVomOrt = require('./strasseVomOrt')

const firstYear = 2003
const cols = ['bezirk', 'ort', 'measure', 'status']

/**
 * An entry of the Wiener Radbauprogramm
 * @typedef {Object} Bauprojekt
 * @property {number[]} bezirk Betroffene Bezirke
 * @property {string} ort Beschreibung des Ortes
 * @property {string[]} strassen Betroffene Straßen (erkannt aus ort)
 * @property {string} measure Geplante Maßnahmen
 * @property {string} status aktueller Status (e.g. 'in Arbeit', 'fertiggestellt')
 */

/**
 * Load the bauprogramm of a specific year from the Wien homepage.
 * @param {Object} options - Options
 * @param {Number|string} [options.year] - Load bauprogramm for a previous year. Omit for the current year. Use "all" for all years.
 * @returns {Bauprojekt[]}
 */
function loadBauprogramm (options, callback) {
  if (options.year === 'all') {
    return loadAllBauprogramme(options, callback)
  }

  let url = 'https://www.wien.gv.at/verkehr/radfahren/bauen/programm/'
  if ('year' in options) {
    url += options.year + '.html'
  }

  fetch(url)
    .then(req => req.arrayBuffer())
    .then(body => {
      body = iconv.decode(Buffer.from(body), 'ISO-8859-15').toString()
      const dom = new JSDOM(body)

      const h1 = dom.window.document.getElementsByTagName('h1')
      if (!h1.length) {
        return callback(new Error('No header found'))
      }
      const m = h1[0].textContent.match(/Bauprogramm Radverkehrsanlagen (\d{4})/)
      if (!m) {
        return callback(new Error('Can\'t parse header'))
      }
      const year = parseInt(m[1])

      const tables = dom.window.document.getElementsByTagName('table')

      if (!tables.length) {
        return callback(new Error('No tables found'))
      }

      const list = []
      Array.from(tables).forEach(table => {
        const trs = table.getElementsByTagName('tr')
        Array.from(trs).forEach(row => {
          const tds = row.getElementsByTagName('td')
          if (!tds.length) {
            return
          }

          const entry = {}
          Array.from(tds).forEach((td, col) => {
            td.innerHTML = td.innerHTML.replace(/<br>/g, '<br>\n')
            entry[cols[col]] = td.textContent.replace(/[\t\n]+/g, '\n')
          })

          entry.bezirk = entry.bezirk
            .split(/ und /g)
            .map(v => parseInt(v.substr(0, v.length - 1)))

          entry.year = year

          entry.strassen = strasseVomOrt(entry.ort)

          list.push(entry)
        })
      })

      callback(null, list)
    })
}

function loadAllBauprogramme (options, callback) {
  const o = {...options}
  delete o.year
  loadBauprogramm(o, (err, list) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    const year = list[0].year
    async.map(range(firstYear, year - 1),
      (year, done) => {
        const o = {...options, year}
        loadBauprogramm(o, done)
      },
      (err, result) => {
        if (err) {
          console.error(err)
          process.exit(1)
        }

        result.push(list)
        result = result.flat()

        callback(null, result)
      }
    )
  })
}

module.exports = loadBauprogramm
