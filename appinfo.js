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
    }
    setDate(date) {
      this.date = date
    }
    setVersion(ver) {
        this.version = ver
    }
  }

  
