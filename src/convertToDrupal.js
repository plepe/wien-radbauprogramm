/* eslint-disable camelcase */
const async = require('async')
const drupal = require('./drupal')

const strasseVomOrt = require('./strasseVomOrt')
const parseMassnahmen = require('./parseMassnahmen')
const str2tags = require('./str2tags')

const mapping = {
  bezirk: {
    field: 'field_bezirk',
    load: v => bezirke[v.target_id],
    save: v => { return { target_id: bezirke_nid[v] } }
  },
  ort: {
    field: 'field_ort',
    single: true
  },
  measure: {
    field: 'field_massnahme',
    single: true
  },
  status: {
    field: 'field_status',
    load: v => status[v.target_id],
    save: v => {
      if (!(v in status_nid)) {
        throw new Error('Status ' + v + ' unbekannt')
      }

      return { target_id: status_nid[v] }
    },
    single: true
  },
  year: {
    field: 'field_jahr',
    single: true
  },
  lastChange: {
    field: 'field_status_change',
    single: true,
    save: v => v ? { value: v.substr(0, 10) } : null
  },
  log: {
    field: 'field_log',
    single: false
  },
  nid: {
    field: 'nid',
    single: true
  }
}

const bezirke = {}
const bezirke_nid = {}
const status = {}
const status_nid = {}

module.exports = {
  load: (db, callback) => {
    const programm = db.addCollection('entries')

    async.waterfall([
      (done) => drupal.login(done),
      (done) => drupal.loadRestExport('rest/bezirke', {}, (err, data) => {
        if (err) { return done(err) }

        data.forEach(e => {
          bezirke[e.nid[0].value] = parseInt(e.field_id[0].value)
          bezirke_nid[e.field_id[0].value] = e.nid[0].value
        })
        done()
      }),
      (done) => drupal.loadRestExport('rest/status', {}, (err, data) => {
        if (err) { return done(err) }

        data.forEach(e => {
          status[e.tid[0].value] = e.name[0].value
          status_nid[e.name[0].value] = e.tid[0].value
        })
        done()
      }),
      (done) => drupal.loadRestExport('rest/bauprogramm', {}, (err, data) => {
        if (err) { return done(err) }

        const converted = data.map(node => {
          const entry = {}
          Object.keys(mapping).forEach(k => {
            const d = mapping[k]
            if (d.single) {
              if (d.load) {
                entry[k] = node[d.field].length ? d.load(node[d.field][0]) : null
              } else {
                const v = node[d.field].length ? node[d.field][0].value : null
                entry[k] = typeof v === 'string' ? v.replace(/\r\n/g, '\n') : v
              }
            } else {
              if (d.load) {
                entry[k] = node[d.field].map(v => d.load(v))
              } else {
                entry[k] = node[d.field].map(v => {
                  return typeof v.value === 'string' ? v.value.replace(/\r\n/g, '\n') : v.value
                })
              }
            }
          })
          programm.insert(entry)
          return entry
        })
        callback(null, converted)
      })
    ])
  },

  update (entry, callback) {
    const node = { type: [{ target_id: 'bauprogramm' }] }
    Object.keys(mapping).forEach(k => {
      const d = mapping[k]

      if (d.single) {
        const value = d.save ? [d.save(entry[k])] : [{ value: entry[k] }]
        node[d.field] = value.filter(v => v != null)
      } else {
        if (entry[k]) {
          const value = d.save ? entry[k].map(v => d.save(v)) : entry[k].map(v => { return { value: v } })
          node[d.field] = value.filter(v => v != null)
        } else {
          console.log(k, 'is not an array: ', entry[k])
        }
      }
    })

    delete node.nid

    node.title = [{ value: entry.ort.replace(/\n/g, ' – ') }]

    // automatically add tags for new entries
    if (!entry.nid) {
      return addTags(entry, node, (err) => {
        if (err) { return callback(err) }
        save(entry, node, callback)
      })
    }

    save(entry, node, callback)
  }
}

function save (entry, node, callback) {
  drupal.nodeSave(entry.nid, node, {}, (err, result) => {
    if (err) { return callback(err) }

    console.log('saved', result.nid[0].value)
    callback()
  })
}

function addTags (entry, node, callback) {
  const strassen = strasseVomOrt(entry.ort)
  const massnahmen = parseMassnahmen(entry.measure)

  str2tags([].concat(strassen, massnahmen),
    (err, ids) => {
      if (err) { return callback(err) }

      node.field_tags = ids.map(target_id => { return { target_id } })

      callback()
    }
  )
}

// nodeSave(2, { type: [{target_id: 'bauprogramm'}], title: [{value: 'Foobar'}] }, {}, (err, node) => console.log(node)))
