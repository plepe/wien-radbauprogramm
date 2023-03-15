module.exports = function strasseVomOrt (street) {
  if (street.split('/').length > 1) {
    return street.split('/').map(s => strasseVomOrt(s)).flat()
  }

  const m = street.match(/^(Querung |)(.*?)(\r|\n|, |; | \(| von| bis| im| zwischen| südlich| nördlich| westlich| östlich| Ecke| Nebenfahrbahn| gegenüber| Kreuzung)/)
  if (m) {
    street = m[2]
  }

  return street.split(/ (?:-|und) /g)
    .map(s => s.trim())
    .filter(s => !s.match(/^B[0-9]+$/))
}
