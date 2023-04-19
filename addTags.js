const async = require('async')

const database = require('./src/database')
const drupal = require('./src/drupal')
const strasseVomOrt = require('./src/strasseVomOrt')
const parseMassnahmen = require('./src/parseMassnahmen')
const str2tags = require('./src/str2tags')

function init () {
  async.waterfall([
    (done) => database.load({}, (err) => done(err))
  ], run)
}

function run (err) {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  database.load({}, (err, list) => {
    async.eachSeries(list.find(), (entry, done) => {
      console.log(entry.nid)
      let node
      let currentTags
      const update = {}

      async.waterfall([
        (done) => drupal.nodeGet(entry.nid, done),
        (_node, done) => {
          node = _node
          currentTags = node.field_tags.map(t => t.target_id)

          const strassen = strasseVomOrt(entry.ort)
          const massnahmen = parseMassnahmen(entry.measure)

          str2tags([].concat(strassen, massnahmen), done)
        },
        (_ids, done) => {
          const newTags = _ids.filter(id => !currentTags.includes(id))
          if (newTags.length) {
            update.field_tags = node.field_tags.concat(
              newTags.map(target_id => { return { target_id } })
            )
          }

          const title = entry.ort.replace(/\n/g, ' – ')
          if (node.title[0].value !== title) {
            update.title = [{ value: title }]
          }

          if (Object.keys(update).length) {
            update.type = node.type
            console.log(update)

            drupal.nodeSave(entry.nid, update, done)
          } else {
            done()
          }
        }
      ], done)
    })
  })
}

init()
