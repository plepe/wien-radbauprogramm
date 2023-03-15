#!/usr/bin/env node
const loadBauprogramm = require('./src/loadBauprogramm')

const options = {}

loadBauprogramm(options,
  (err, list) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    console.log(JSON.stringify(list, null, '  '))
  }
)
