#!/usr/bin/env node
const ArgumentParser = require('argparse').ArgumentParser

const loadBauprogramm = require('./src/loadBauprogramm')

const options = {}

const parser = new ArgumentParser({
  add_help: true,
  description: 'Lädt das Radbauprogramm der Stadt Wien'
})

const args = parser.parse_args()

loadBauprogramm(options,
  (err, list) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    console.log(JSON.stringify(list, null, '  '))
  }
)
