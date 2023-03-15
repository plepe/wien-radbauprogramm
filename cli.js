#!/usr/bin/env node
const ArgumentParser = require('argparse').ArgumentParser
const Parser = require('@json2csv/plainjs').Parser

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

parser.add_argument('--format', '-f', {
  help: 'Welches Format soll für die Ausgabe verwendet werden (Default: json).',
  choices: ['json', 'csv'],
  default: 'json'
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

    switch (args.format) {
      case 'json':
        console.log(JSON.stringify(list, null, '  '))
        break
      case 'csv':
        const parser = new Parser({ withBOM: true })
        list = array2string(list)
        const csv = parser.parse(list)
        console.log(csv)
        break
      default:
        console.error('Invalid format')
        process.exit(1)
    }
  }
)

function array2string (list) {
  return list
    .map(entry =>
      Object.fromEntries(Object.entries(entry).map(([k, v]) => {
        if (Array.isArray(v)) {
          v = v.join(', ')
        }

        return [k, v]
      }))
    )
}
