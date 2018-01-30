require('isomorphic-fetch')

const Rx = require('rx')
const RxNode = require('rx-node')
const path = require('path')

const readline = require('readline')

const d2 = require('d2/lib/d2')

const dhis2_home = process.env.DHIS2_HOME
const config = require(path.join(dhis2_home, 'config.json'))

// set up the readline interface
const defCmds =
    ['help'
    , 'models'
    , 'exit'
    ]

const rl = repl(
    { completer: tabComplete(defCmds)
    , prompt: '> '
    }
)

const initialState =
    { rl
    , mode: 'default'
    , cmd: 'help'
    , baseUrl: config.baseUrl + '/api'
    , headers:
        { 'authorization': config.authorization
        , 'x-requested-with': 'XMLHttpRequest'
        }
    }

const rl$ = RxNode.fromReadLineStream(rl)

const d2$ = Rx.Observable.fromPromise(d2.init(
    { baseUrl: initialState.baseUrl
    , headers: initialState.headers
    }
))

const state$ = Rx.Observable
    .merge(
        rl$.map(cmd => state => {
            return Object.assign(state, { cmd })
        }),
        d2$.map(d2 => state => {
            return Object.assign(state, { d2 })
        }),
    )
    .scan((state, makeNew) => makeNew(state), initialState)
    .startWith(initialState)

state$.subscribe(
    state => { 
        if (!state.d2) {
            console.info('Waiting for D2 to init...')
        } else {
            rxmain(state)
        }
    }
    , err => console.error(err)
    , exit
)

function rxmain (state) {
    const { cmd, d2, rl } = state
    parsecmd(d2, cmd, rl)
    rl.prompt()
}

function tabComplete(completions) {
    completions.sort()
    return function wrappedCompleter(partial, cb) {
        const re = new RegExp('^'+partial+'.*$')
        const hits = completions.filter(c => re.test(c))
        cb(null, [hits, partial])
    }
}

function repl(opts = {}) {
    const stdin = process.stdin
    const stdout = process.stdout

    stdin.setEncoding('utf8')

    const rl = readline.createInterface(
        { input: stdin
        , output: stdout
        , terminal: true
        }
    )

    rl.setPrompt(opts.prompt)
    rl.prompt()

    return rl
}

function exit () {
    console.log('\nAight, closing up shop. See you next time!')
    process.exit(0);
}

function parsecmd (d2, line, rl) {
    //d2.models.programIndicator.modelProperties)

    if (line.startsWith('help')) {
        console.info(`Available commands are: ${defCmds}`)
    }

    if (line.startsWith('exit')) {
        exit()
    }
            
    const models = Object.keys(d2)
    rl.completer = tabComplete(defCmds.concat(models))

    const modelProps = get(d2, line)
    pp(modelProps)
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
