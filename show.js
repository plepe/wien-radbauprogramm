const LokiJS = require('lokijs')

const db = new LokiJS('data/data.db', {
  autoload: true,
  autoloadCallback: init,
  autosave: true
})

function init () {
  let programm = db.getCollection('entries')

  const results = programm.find({})
  console.log(JSON.stringify(results, null, '  '))

  process.exit(0)
}
