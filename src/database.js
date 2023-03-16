const LokiJS = require('lokijs')
const drupal = require('./drupal')
const config = require('../config.json')

class Database {
  load (options, callback) {
    if (!config.drupal) {
      this.db = new LokiJS('data/data.db', {
        autoload: true,
        autoloadCallback: () => this._load(callback),
        autosave: true
      })

      return
    }

    this.db = new LokiJS()

    drupal.load(this.db, (err) => {
      if (err) { return callback(err) }

      this._load(callback)
    })
  }

  _load (callback) {
    this.firstRun = false
    let programm = this.db.getCollection('entries')
    if (programm === null) {
      this.firstRun = true
      programm = this.db.addCollection('entries')
    }

    callback(null, programm)
  }

  update (entry, callback) {
    if (config.drupal) {
      drupal.update(entry, callback)
    } else {
      callback()
    }
  }

  close (options, callback) {
    this.db.close(callback)
  }
}

module.exports = new Database()
