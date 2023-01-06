const JSDOM = require('jsdom').JSDOM
const iconv = require('iconv-lite')

const cols = ['bezirk', 'ort', 'measure', 'status']
const year = 2022

fetch('https://www.wien.gv.at/verkehr/radfahren/bauen/programm/')
  .then(req => req.arrayBuffer())
  .then(body => {
    body = iconv.decode(new Buffer(body), 'ISO-8859-15').toString()
    const dom = new JSDOM(body)
    const tables = dom.window.document.getElementsByTagName('table')

    if (!tables.length) {
      console.error('No tables found')
      process.exit(1)
    }

    const trs = tables[0].getElementsByTagName('tr')
    const list = Array.from(trs).map(row => {
      const tds = row.getElementsByTagName('td')
      if (!tds.length) {
        return
      }

      const entry = {}
      Array.from(tds).forEach((td, col) => {
        entry[cols[col]] = td.textContent
      })

      entry.bezirk = entry.bezirk
        .split(/ und /g)
        .map(v => parseInt(v.substr(0, v.length - 1)))

      entry.year = year

      return entry
    })

    console.log(JSON.stringify(list, null, '  '))
  })
