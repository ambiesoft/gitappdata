const stripBom = require('strip-bom');

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
  constructor(v) {
    Object.assign(this, v)
    delete this['user']
    delete this['repotype']
    delete this['password']
  }


  setHistory(his) {
    this.history = stripBom(his)
    this.date = getDateFromHistory(this.history)
    this.version = getVersionFromHistory(this.history)
  }

  setIconUrl(url) {
    this.iconUrl = url;
  }
  setIconDataBase64(data) {
    this.iconDataBase64 = data;
  }
}


