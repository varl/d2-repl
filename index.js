require('isomorphic-fetch')
const readline = require('readline')

const d2 = require('d2/lib/d2')

async function main () {
    try {
        const d2c = await d2.init(
            { baseUrl: 'http://dev-dhis2:8080/dhis/api'
            , headers: { authorization: 'Basic YWRtaW46ZGlzdHJpY3Q=' }
            })

        repl({ d2c })
    } catch (e) {
        console.error(e)
    }
}

function tabComplete(partial, cb) {
    const completions = ['help']
    const hits = completions.filter(c => c.startsWith(partial))

    cb(null, [hits, partial])
}

function repl(opts = {}) {
    const d2 = opts.d2c
    const stdin = process.stdin
    const stdout = process.stdout

    stdin.setEncoding('utf8')

    const rl = readline.createInterface(
        { input: stdin
        , output: stdout
        , terminal: true
        , completer: tabComplete
        })

    rl.setPrompt('>')
    rl.prompt()

    rl.on('line', function (line) {
        cmd(d2, line)
        rl.prompt()
    })

    rl.on('close', function () {
        console.log('\nAight, closing up shop. See you next time!')
        process.exit(0);
    })
}

function cmd (d2, line) {
    //d2.models.programIndicator.modelProperties)
    let args = line.split(' ')

    let cmdstr = args[0]
    let cmdparam = args[1]

    switch(cmdstr) {
        case 'model':
            console.log(Object.keys(d2.models[cmdparam].modelProperties))
            break;
        default:
            console.log(`Unknown command: '${line}'`)
    }
}

main()
