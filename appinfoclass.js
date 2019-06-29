
function getXXXCommon(history, what) {
  var lines = history.split(/\r?\n/g)
  for (line of lines) {
    matches = line.match(/\d+\.\d+\.\d+/)
    if (matches) {
      if (what === 'history')
        return line.split(' ')[0]
      else if (what === 'version')
        return matches[0]
    }
  }
}
function getDateFromHistory(history) {
  return getXXXCommon(history, 'history')
}
function getVersionFromHistory(history) {
  return getXXXCommon(history, 'version')
}

module.exports = class AppInfo {
  constructor(name, owner) {
    this.name = name;
    this.owner = owner;
  }

  setOnelineDesc(desc) {
    this.onelinedesc = desc
  }
  setHistory(his) {
    this.history = his
    this.date = getDateFromHistory(this.history)
    this.version = getVersionFromHistory(this.history)
  }
}


