// try {
//     const config = require('gitappdata.config')
// }
// console.log("cwd = " + process.cwd())
function dlog(s) {
    if (Debugging) {
        console.log(s)
    }
}

function btoa(b) {
    return Buffer.from(b, 'base64').toString()
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
// to enable deep level flatten use recursion with reduce and concat
function flatDeep(arr, d = 1) {
   return d > 0 ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val), [])
                : arr.slice();
};


// GitHub API interface 
// const Octokit = require('@octokit/rest')
const { Octokit } = require("@octokit/rest")

// Bitbucket API interface
const Bitbucket = require('bitbucket')

const AppInfo = require('./appinfoclass')
const Debugging = false

module.exports = class GetGitAppData {
    constructor(options={}) {
        let clientOptions = {
            baseUrl: 'https://api.bitbucket.org/2.0',
            headers: {},
            options: {
                // timeout: 1000
            },
            hideNotice: true
        } 
        // Merge or overrite by options
        clientOptions = {...clientOptions, ...options}
        this.bitbucket = new Bitbucket(clientOptions)
        this.octokit = new Octokit()
    }
    async get(config) {
        // var appinfos = []
        var dupnamecheck = []
        var promises = config.map(v => {

            if (v.repotype !== 'github' &&
                v.repotype !== 'bitbucket') {
                throw 'repotype must be "github" or "bitbucket"';
            }

            if (dupnamecheck.includes(v.owner + v.name)) {
                throw `Duplicate entry: ${v.owner}, ${v.name}`
            }
            dupnamecheck.push(v.owner + v.name)

            let appinfo = new AppInfo(v)

            if (v.repotype === 'github') {
                let rets = [];
                rets.push(this.octokit.repos.getContents({
                    owner: v.owner,
                    repo: v.name,
                    path: v.history
                }).then(({ data }) => {
                    let rawhistory = btoa(data.content)
                    dlog(rawhistory)
                    appinfo.setHistory(rawhistory)
                    return appinfo;
                }));

                if(v.icon) {
                    rets.push(this.octokit.repos.getContents({
                        owner: v.owner,
                        repo: v.name,
                        path: v.icon,
                    }).then(({ data }) => {
                        appinfo.setIconUrl(data.download_url)
                        return appinfo;
                    }));
                }

                return rets;
            } else if (v.repotype === 'bitbucket') {
                if (v.username) {
                    this.bitbucket.authenticate({
                        type: 'basic',
                        username: v.username,
                        password: v.password
                    })
                }
                // https://bitbucketjs.netlify.com/#api-repositories-repositories_readSrc
                return this.bitbucket.repositories
                    .readSrc({
                        username: v.owner,
                        node: 'master',
                        path: v.history,
                        repo_slug: v.name,
                    })
                    .then(({ data, headers }) => {
                        dlog(data)
                        appinfo.setHistory(data)
                        return appinfo
                        //appinfos.push(appinfo)



                        // appinfo.setDate(getDateFromHistory(data))
                        // appinfo.setVersion
                        // return bitbucket.refs.listTags({
                        //     repo_slug: v.name,
                        //     username: v.owner
                        // })
                        // .then(({data, header}) => {
                        //     dlog(data)
                        //     appinfo.setVersion(data[0].name)
                        //     appinfos.push(appinfo)
                        // })
                    })
                    .catch(err => console.error(err))
            }
        })
        
        let ret = flatDeep(promises,Infinity);
        return ret;
    }
}


