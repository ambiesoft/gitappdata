const utf8 = require('utf8');
var path = require('path');
// could not use 'require' outside of source directory
var fs = require('fs');

let DEBUGGING = false;
function dtrace(message) {
    if(DEBUGGING) {
        console.log(message)
    }
}
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
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
var outputfile
var output;
if (process.argv === undefined || process.argv.length <= 2) {
    config = toArray(require('./config/default.json'));
} else {
    const optionDefinitions = [
        { name: 'output', alias: 'o', type: String },
        { name: 'target', alias: 't', type: String },
        { name: 'src', type: String, defaultOption: true },
      ]
    const commandLineArgs = require('command-line-args')
    const options = commandLineArgs(optionDefinitions)

    config = toArray(JSON.parse(fs.readFileSync(options.src, 'utf8')));
    if(options.target) {
        // remove other than target
        config = config.filter(item => {
            return item.name == options.target;
        });
        if(config.length==0) {
            console.log(`${options.target} is not contained in ${options.src}`);
            return;
        }
    }
    outputfile = options.output;
}
if(!outputfile) {
    console.log('No output file specified')
    return
}

// Read output json (later merged)
if(fs.existsSync(outputfile)) {
    output = toArray(JSON.parse(fs.readFileSync(outputfile)));
}

let gitappdata = new GitAppData();
gitappdata.get(config)
.then(promises => {
    Promise.all(promises).then((appinfos) => {
        // appinfos is array of map
        // appinfos contains duplidate object due to multiple promises for same object
        // Unique appinfo
        appinfos = appinfos.filter(onlyUnique);

        // overwrite output with appinfos
        if(output) {
            for(item of appinfos) {
                // first remove from output
                output = output.filter(outitem => {
                    return outitem.name != item.name;
                })

                // add to output
                output.push(item);
            }
        } else {
            output = appinfos;
        }

        // write to file
        const str = JSON.stringify(output)
        fs.writeFileSync(outputfile, str)
        // console.log(JSON.stringify(appinfos))
    })

})
.catch(err => console.log(err))


dtrace('file ends')
