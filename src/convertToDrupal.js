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
        console.error('Status ' + v + ' unbekannt')
        return { target_id: null }
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
    shortenText: 255,
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
          const entry = mapEntryFromNode(node, mapping)
          programm.insert(entry)
          return entry
        })
        callback(null, converted)
      })
    ])
  },

  update (entry, callback) {
    let node

    async.waterfall([
      (done) => {
        if (entry.nid) {
          drupal.nodeGet(entry.nid, (err, _node) => {
            node = _node
            done()
          })
        } else {
          node = {
            type: [{ target_id: 'bauprogramm' }],
            field_protokoll: []
          }

          done()
        }
      },
      (done) => {
        const update = { type: node.type }
        Object.keys(mapping).forEach(k => {
          const d = mapping[k]

          if (d.single) {
            const value = d.save ? [d.save(entry[k])] : [{ value: entry[k] }]
            update[d.field] = value.filter(v => v != null)
          } else {
            if (entry[k]) {
              const value = d.save ? entry[k].map(v => d.save(v)) : entry[k].map(v => { return { value: v } })
              update[d.field] = value.filter(v => v != null)
            } else {
              console.log(k, 'is not an array: ', entry[k])
            }
          }

          if (d.shortenText) {
            update[d.field] = update[d.field].map(v => v.value.substr(0, d.shortenText))
          }
        })

        delete update.nid

        update.title = [{ value: entry.ort.replace(/\n/g, ' – ') }]

        if (entry.protokollEntry && (Object.keys(entry.protokollEntry).length > 1 || entry.protokollEntry.text.length)) {
          const data = {
            type: [{ target_id: 'status_aenderung' }],
            title: [{ value: 'änderung' }],
            field_datum: [{ value: new Date().toISOString().substr(0, 10) }]
          }

          if (entry.protokollEntry.text.length) {
            data.body = [{
              value: entry.protokollEntry.text.map(t => '<p>' + t + '</p>').join('\n'),
              format: 'basic_html'
            }]
          }

          if (entry.protokollEntry.status) {
            data.field_status = [{ target_id: status_nid[entry.protokollEntry.status] }]
          }

          update.field_protokoll = node.field_protokoll
          update.field_protokoll.push({ target_type: 'node', data })
        }

        // automatically add tags for new entries
        if (!entry.nid) {
          return addTags(entry, update, (err) => {
            if (err) { return callback(err) }
            save(entry, update, callback)
          })
        }

        save(entry, update, done)
      }
    ], callback)
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

function mapEntryFromNode (node, mapping) {
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

  return entry
}

// nodeSave(2, { type: [{target_id: 'bauprogramm'}], title: [{value: 'Foobar'}] }, {}, (err, node) => console.log(node)))
