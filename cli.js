#!/usr/bin/env node
const ArgumentParser = require('argparse').ArgumentParser

const loadBauprogramm = require('./src/loadBauprogramm')

const options = {}

const parser = new ArgumentParser({
  add_help: true,
  description: 'Lädt das Radbauprogramm der Stadt Wien'
})

parser.add_argument('--year', '-y', {
  help: 'Lade das Bauprogramm eines vergangenen Jahres. Für das aktuelle Jahr muss der Parameter weggelassen werden.',
  default: null
})

const args = parser.parse_args()
if (args.year) {
  options.year = args.year
}

loadBauprogramm(options,
  (err, list) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    console.log(JSON.stringify(list, null, '  '))
  }
)
