const async = require('async')

const database = require('./src/database')
const drupal = require('./src/drupal')
const strasseVomOrt = require('./src/strasseVomOrt')

const tags = {}
const tagsId = {}

function init () {
  async.waterfall([
    (done) => database.load({}, (err) => done(err)),
    (done) => drupal.call().loadRestExport('rest/taxonomy?type=tags', {paginated: true}, (err, data) => {
      if (err) { return done(err) }

      data.forEach(e => {
        tags[e.tid[0].value] = e.name[0].value
        tagsId[e.name[0].value] = e.tid[0].value
      })

      done()
    })
  ], run)
}

function run (err) {
  console.log(tagsId)
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
        (done) => drupal.call().nodeGet(entry.nid, done),
        (_node, done) => {
          node = _node
          currentTags = node.field_tags.map(t => t.target_id)

          const strassen = strasseVomOrt(entry.ort)
          str2Tags(strassen, done)
        },
        (_ids, done) => {
          const newTags = _ids.filter(id => !currentTags.includes(id))
          if (newTags.length) {
            update.field_tags = node.field_tags.concat(
              newTags.map(target_id => { return { target_id } })
            )
          }

          if (Object.keys(update).length) {
            update.type = node.type
            console.log(update)

            drupal.call().nodeSave(entry.nid, update, done)
          } else {
            done()
          }
        }
      ], done)
    })
  })
}

function str2Tags (strs, callback) {
  async.mapSeries( 
    strs,
    (str, done) => tagsGet(str, done),
    callback
  )
}

function tagsGet (value, callback) {
  if (value in tagsId) {
    return callback(null, tagsId[value])
  }

  const update = {
    vid: [{ target_id: 'tags' }],
    name: [{ value }]
  }

  console.log(update)
  drupal.call().taxonomySave(null, update, (err, e) => {
    if (err) { return callback(err) }

    tags[e.tid[0].value] = e.name[0].value
    tagsId[e.name[0].value] = e.tid[0].value

    callback(null, tagsId[value])
  })
}

init()
