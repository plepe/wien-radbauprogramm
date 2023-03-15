# wien-radbauprogramm
Analyser for Wien's Radbauprogramm

## Installation
```sh
git clone https://github.com/plepe/wien-bauprogramm
cd wien-bauprogramm
npm install
```

## Usage
Extract current bauprogramm as JSON:
```sh
node cli.js
```

Extract bauprogramm of 2003 as CSV:
```
node cli.js --format=csv --year=2003
```

More options:
```
node cli.js --help
```

## Create API documentation
```
npm run doc
```
Open doc/index.html
