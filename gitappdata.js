// try {
//     const config = require('gitappdata.config')
// }
// console.log("cwd = " + process.cwd())
var config
if ( process.argv === undefined || process.argv.length <= 2) {
    config = require('./config/default.json')
} else {
    // could not use 'require' outside of source directory
    var fs = require('fs');
    config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
}
// console.log(config)
// console.log(Array.isArray(config))
var tmp = []
for( v of config) {
    tmp.push(v)
}
config = tmp

const Octokit = require('@octokit/rest')
const octokit = new Octokit()
const AppInfo = require('./appinfo')
const Debugging = false

function dlog(s) {
    if (Debugging) {
        console.log(s)
    }
}

global.btoa = function (b) {
    return Buffer.from(b, 'base64').toString()
}
function getDateFromHistory(history) {
    history = btoa(history)
    var line = history.split(/\r?\n/g)[0]
    return line.split(' ')[0]
}
function main() {
    var appinfos = []
    var dupnamecheck = []
    var promises = config.map(function (v) {

        if (v.repotype !== 'github') {
            throw 'repotype must be github';
        }

        if (dupnamecheck.includes(v.owner + v.name)) {
            throw `Duplicate entry: ${v.owner}, ${v.name}`
        }
        dupnamecheck.push(v.owner + v.name)

        let appinfo = new AppInfo(v.name, v.owner);
        appinfo.setOnelineDesc(v.onelinedesc)

        return octokit.repos.getContents({
            owner: v.owner,
            repo: v.name,
            path: v.history
        }).then(({ data }) => {
            dlog(btoa(data.content))
            appinfo.setHistory(data.content)
            appinfo.setDate(getDateFromHistory(data.content))
            return octokit.repos.listTags({
                owner: v.owner,
                repo: v.name,
            }).then(({ data }) => {
                dlog(data)
                appinfo.setVersion(data[0].name)
                appinfos.push(appinfo)
            })
        })


    })

    Promise.all(promises).then((_) => {
        afterRetrieval(appinfos)
    })
}

function afterRetrieval(appinfos) {
    dlog(appinfos);
    console.log(JSON.stringify(appinfos))
}


main()
