#!/usr/bin/env node
const fs = require('fs')
const ArgumentParser = require('argparse').ArgumentParser
const Parser = require('@json2csv/plainjs').Parser
const async = require('async')

const loadBauprogramm = require('./src/loadBauprogramm')
const database = require('./src/database')
const matchDatabase = require('./src/matchDatabase')

const options = {}

const parser = new ArgumentParser({
  add_help: true,
  description: 'Lädt das Radbauprogramm der Stadt Wien'
})

parser.add_argument('--output', '-o', {
  help: 'Schreibe in die angegebene Datei. Wenn leer, Ausgabe an stdout.',
  default: null
})

parser.add_argument('--year', '-y', {
  help: 'Lade das Bauprogramm eines vergangenen Jahres, oder aller Jahre ("all"). Für das aktuelle Jahr muss der Parameter weggelassen werden.',
  default: null
})

parser.add_argument('--format', '-f', {
  help: 'Welches Format soll für die Ausgabe verwendet werden (Default: json).',
  choices: ['json', 'csv'],
  default: 'json'
})

const args = parser.parse_args()
if (args.year) {
  options.year = args.year
}

const file = args.output

let programm

async.parallel(
  {
    bauprogramm: (done) => loadBauprogramm(options, done),
    entries: (done) => database.load({}, done)
  },
  (err, { bauprogramm, entries }) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    matchDatabase(options, bauprogramm, entries, (err, result) => {
      console.log(JSON.stringify(result, null, '  '))
      database.close()
    })
  }
)
