let DEBUGGING = false;
function dtrace(message) {
    if(DEBUGGING) {
        console.log(message)
    }
}

const GitAppData = require('./index')

function toArray(o) {
    var tmp = []
    for (v of o) {
        tmp.push(v)
    }
    return tmp
}

var config
if (process.argv === undefined || process.argv.length <= 2) {
    config = require('./config/default.json')
} else {
    // could not use 'require' outside of source directory
    var fs = require('fs');
    config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
}
config = toArray(config)


let gitappdata = new GitAppData();
gitappdata.get(config)
.then(promises => {
    Promise.all(promises).then((appinfos) => {
        console.log(JSON.stringify(appinfos))
    })

})
.catch(err => console.log(err))


dtrace('file ends')
