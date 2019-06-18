// try {
//     const config = require('gitappdata.config')
// }
// console.log("cwd = " + process.cwd())
function dlog(s) {
    if (Debugging) {
        console.log(s)
    }
}
function toArray(o) {
    var tmp = []
    for (v of o) {
        tmp.push(v)
    }
    return tmp
}
global.btoa = function (b) {
    return Buffer.from(b, 'base64').toString()
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

// GitHub API interface 
const Octokit = require('@octokit/rest')
const octokit = new Octokit()

// Bitbucket API interface
const Bitbucket = require('bitbucket')
const clientOptions = {
    baseUrl: 'https://api.bitbucket.org/2.0',
    headers: {},
    options: {
        timeout: 1000
    }
}
const bitbucket = new Bitbucket(clientOptions)


const AppInfo = require('./appinfo')
const Debugging = false

function getDateFromHistory(history) {
    history = btoa(history)
    var line = history.split(/\r?\n/g)[0]
    return line.split(' ')[0]
}
function main() {
    var appinfos = []
    var dupnamecheck = []
    var promises = config.map(function (v) {

        if (v.repotype !== 'github' &&
            v.repotype !== 'bitbucket') {
            throw 'repotype must be "github" or "bitbucket"';
        }

        if (dupnamecheck.includes(v.owner + v.name)) {
            throw `Duplicate entry: ${v.owner}, ${v.name}`
        }
        dupnamecheck.push(v.owner + v.name)

        let appinfo = new AppInfo(v.name, v.owner);
        appinfo.setOnelineDesc(v.onelinedesc)

        if (v.repotype === 'github') {
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
        } else if (v.repotype === 'bitbucket') {
            if (v.username) {
                bitbucket.authenticate({
                    type: 'basic',
                    username: v.username,
                    password: v.password
                })
            }
            return bitbucket.repositories
                .list({ username: v.owner })
                .then(({ data, headers }) => {
                    console.log(data.values)
                })
                .catch(err => console.error(err))
        }
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
