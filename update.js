const loadBauprogramm = require('./src/loadBauprogramm')

loadBauprogramm('https://www.wien.gv.at/verkehr/radfahren/bauen/programm/',
  (err, list) => {
    console.log(JSON.stringify(list, null, '  '))
  }
)
