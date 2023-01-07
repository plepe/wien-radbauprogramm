const JSDOM = require('jsdom').JSDOM
const iconv = require('iconv-lite')

const cols = ['bezirk', 'ort', 'measure', 'status']

module.exports = function loadBauprogramm (url, callback) {
  fetch(url)
    .then(req => req.arrayBuffer())
    .then(body => {
      body = iconv.decode(new Buffer(body), 'ISO-8859-15').toString()
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
            entry[cols[col]] = td.textContent
          })

          entry.bezirk = entry.bezirk
            .split(/ und /g)
            .map(v => parseInt(v.substr(0, v.length - 1)))

          entry.year = year

          list.push(entry)
        })
      })

      callback(null, list)
    })
}
