const async = require('async')
const DrupalRest = require('drupal-rest')
const config = require('../config.json')

const drupal = new DrupalRest(config.drupal)

const mapping = {
  'bezirk': {
    field: 'field_bezirk',
    load: v => bezirke[v.target_id],
    save: v => { return { target_id: bezirke_nid[v] } },
  },
  'ort': {
    field: 'field_ort',
    single: true
  },
  'measure': {
    field: 'field_massnahme',
    single: true
  },
  'status': {
    field: 'field_status',
    load: v => status[v.target_id],
    save: v => { return { target_id: status_nid[v] } },
    single: true
  },
  'year': {
    field: 'field_jahr',
    single: true
  },
  'lastChange': {
    field: 'field_status_change',
    single: true,
    save: v => v ? { value: v.substr(0, 19) + 'Z' } : null
  },
  'log': {
    field: 'field_log',
    single: false,
  },
  'nid': {
    field: 'nid',
    single: true
  }
}

let bezirke = {}
let bezirke_nid = {}
let status = {}
let status_nid = {}

module.exports = {
  load: (db, callback) => {
    const programm = db.addCollection('entries')

    async.waterfall([
      (done) => drupal.login(done),
      (done) => drupal.loadRestExport('rest/bezirke', {}, (err, data) => {
        data.forEach(e => {
          bezirke[e.nid[0].value] = parseInt(e.field_id[0].value)
          bezirke_nid[e.field_id[0].value] = e.nid[0].value
        })
        done()
      }),
      (done) => drupal.loadRestExport('rest/status', {}, (err, data) => {
        data.forEach(e => {
          status[e.tid[0].value] = e.name[0].value
          status_nid[e.name[0].value] = e.tid[0].value
        })
        done()
      }),
      (done) => drupal.loadRestExport('rest/bauprogramm', {}, (err, data) => {
        callback(null, data.map(node => {
          const entry = {}
          Object.keys(mapping).forEach(k => {
            const d = mapping[k]
            if (d.single) {
              if (d.load) {
                entry[k] = node[d.field].length ? d.load(node[d.field][0]) : null
              } else {
                entry[k] = node[d.field].length ? node[d.field][0].value : null
              }
            } else {
              if (d.load) {
                entry[k] = node[d.field].map(v => d.load(v))
              } else {
                entry[k] = node[d.field].map(v => v.value)
              }
            }
          })
          programm.insert(entry)
          return entry
        }))
        done()
      })
    ])
  },

  update (entry, callback) {
    const node = { type: [ { target_id: 'bauprogramm' } ] }
    Object.keys(mapping).forEach(k => {
      const d = mapping[k]

      if (d.single) {
        const value = d.save ? [ d.save(entry[k]) ] : [ { value: entry[k] } ]
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

    if (!entry.nid) {
      node.title = node.field_ort
    }

    drupal.nodeSave(entry.nid, node, {}, (err, result) => {
      console.log('saved', result.nid[0].value)
      callback()
    })
  }
}

    //nodeSave(2, { type: [{target_id: 'bauprogramm'}], title: [{value: 'Foobar'}] }, {}, (err, node) => console.log(node)))
