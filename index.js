require('isomorphic-fetch')
const readline = require('readline')

const d2 = require('d2/lib/d2')

let cli
let mode

let defCmds = ['help', 'models']

async function main () {
    try {
        const d2c = await d2.init(
            { baseUrl: 'http://dev-dhis2:8080/dhis/api'
            , headers: { authorization: 'Basic YWRtaW46ZGlzdHJpY3Q=' }
            })

        cli = repl(
            { d2c
            , completer: tabComplete(defCmds)
            , prompt: '> '
            })

        mode = 'default'

    } catch (e) {
        console.error(e)
    }
}

function tabComplete(completions) {
    return function wrappedCompleter(partial, cb) {
        const re = new RegExp('^'+partial+'.*$')
        const hits = completions.filter(c => re.test(c))
        cb(null, [hits, partial])
    }
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
        , completer: opts.completer
        })

    rl.setPrompt(opts.prompt)
    rl.prompt()

    rl.on('line', function (line) {
        cmd(d2, line)
        rl.prompt()
    })

    rl.on('close', function () {
        console.log('bye')
    })

    return rl
}

function exit () {
    console.log('\nAight, closing up shop. See you next time!')
    process.exit(0);
}

function cmd (d2, line) {
    //d2.models.programIndicator.modelProperties)
    switch(line) {
        case 'models':
            mode = 'models'

            const models = Object.keys(d2.models)

            cli.completer = tabComplete(models)
            cli.setPrompt('models> ')

            break

        case 'esc':
            mode = 'default'
            cli.completer = tabComplete(defCmds)
            cli.setPrompt('> ')

            break

        case 'exit':
            exit()
            
        default:
            const modelProps = get(d2.models, line)
            try {
                pp(modelProps)
            } catch (e) {
                console.log(`Unknown command: '${line}'`, e)
            }
    }
}

function get(models, props) {
    if (props.indexOf('.') === -1 && models.hasOwnProperty(props)) {
        return models[props]
    }

    let proplist = props.split('.')
    let prop = proplist.shift()

    if (models.hasOwnProperty(prop)) {
        return get(models[prop], proplist.join('.'))
    }
}

function pp (thing) {
    if (thing instanceof Object) {
        let list = Object.keys(thing)
        for (let i of list) {
            console.log('\t', i)
        }
    } else {
        console.log(thing)
    }
    console.log('') // just gimme some space
}

main()
