const DrupalRest = require('drupal-rest')

const config = require('../config.json')

const drupal = new DrupalRest(config.drupal)
module.exports = drupal
