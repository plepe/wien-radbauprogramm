const async = require('async')

const drupal = require('./drupal')

let tags = null

function str2tags (strs, callback) {
  strs = strs.filter(v => v)

  if (!tags && strs.length) {
    return loadTags((err) => {
      if (err) { return callback(err) }

      str2tags(strs, callback)
    })
  }

  async.mapSeries(
    strs,
    (str, done) => tagsGet(str, done),
    callback
  )
}

function loadTags (callback) {
  drupal.loadRestExport('rest/taxonomy?type=tags', { paginated: true }, (err, data) => {
    if (err) { return done(err) }

    tags = {}
    data.forEach(e => {
      tags[e.name[0].value] = e.tid[0].value
    })

    callback()
  })
}

function tagsGet (value, callback) {
  if (value in tags) {
    return callback(null, tags[value])
  }

  const update = {
    vid: [{ target_id: 'tags' }],
    name: [{ value }]
  }

  console.log(update)
  drupal.taxonomySave(null, update, (err, e) => {
    if (err) { return callback(err) }

    tags[e.name[0].value] = e.tid[0].value

    callback(null, tags[value])
  })
}

module.exports = str2tags
