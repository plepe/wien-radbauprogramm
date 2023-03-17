const strings = {
  'Radfahren gegen Einbahn': 'Radfahren gegen die Einbahn',
  'Radfahren gegen die Einbahn': 'Radfahren gegen die Einbahn',
  'Bestandsverbesserung': 'Bestandsverbesserung',
  'Zweirichtungsradweg': 'Zweirichtungsradweg',
  'Radroute': 'Radroute',
  'Zweirichtungsradwege': 'Zweirichtungsradweg',
  'Ein-Richtungs-Radweg': 'Einrichtungsradweg',
  'Einrichtungsradwege': 'Einrichtungsradweg',
  'Einrichtungsradweg': 'Einrichtungsradweg',
  'Radweg in eine Richtung': 'Einrichtungsradweg',
  'Radweg in zwei Richtungen': 'Zweirichtungsradweg',
  'Radfahrerüberfahrt': 'Querung',
  'Lückenschluss': 'Lückenschluss',
  'fahrradfreundliche Straße': 'Fahrradfreundliche Straße',
  'Fahrradfreundliche Straße': 'Fahrradfreundliche Straße',
  'Fahrradstraße': 'Fahrradstraße',
  'gemischter Geh- und Radweg': 'Gemischter Geh- und Radweg',
  'Gemischter Geh- und Radweg': 'Gemischter Geh- und Radweg',
  'Geh- und Radweg': 'Geh- und Radweg',
  'Radweg': 'Radweg',
  'Verkehrsberuhigter Bereich': 'Verkehrsberuhigung',
  'Verkehrsberuhigte Straße': 'Verkehrsberuhigung',
  'Verkehrsberuhigung': 'Verkehrsberuhigung',
  'Radfahrstreifen': 'Radfahrstreifen',
  'Netzerweiterung': 'Netzerweiterung',
  'Busfahrstreifen': 'Busspur',
  'Busspur': 'Busspur',
  'Querung': 'Querung',
  'Mehrzweckstreifen': 'Mehrzweckstreifen'
}

module.exports = function parseMassnahmen (str) {
  const list = []

  const parts = str.split(/[:,;]/)

  parts.forEach(s => {
    for (const k in strings) {
      if (s.includes(k)) {
        return list.push(strings[k])
      }
    }
  })

  return list
}
