const LokiJS = require('lokijs')
const drupal = require('./drupal')

class Database {
  load (options, callback) {
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

  close (options, callback) {
    this.db.close(callback)
  }
}

module.exports = new Database()
