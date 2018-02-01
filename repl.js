require('isomorphic-fetch')

const Rx = require('rxjs/Rx')

const repl = require('repl')
const path = require('path')
const util = require('util')

const d2 = require('d2/lib/d2')

const dhis2_home = process.env.DHIS2_HOME
const config = require(path.join(dhis2_home, 'config.json'))

const welcome = `
██████╗ ██╗  ██╗██╗███████╗██████╗ 
██╔══██╗██║  ██║██║██╔════╝╚════██╗
██║  ██║███████║██║███████╗ █████╔╝
██║  ██║██╔══██║██║╚════██║██╔═══╝ 
██████╔╝██║  ██║██║███████║███████╗
╚═════╝ ╚═╝  ╚═╝╚═╝╚══════╝╚══════╝`

const initialState =
    { baseUrl: config.baseUrl + '/api'
    , headers:
        { 'authorization': config.authorization
        , 'x-requested-with': 'XMLHttpRequest'
        }
    }

const d2$ = Rx.Observable.fromPromise(d2.init(
    { baseUrl: initialState.baseUrl
    , headers: initialState.headers
    }
))

const state$ = Rx.Observable
    .merge(
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
            console.info('D2 ready!')
            console.log(welcome)
            console.log(`
    * Quickstart: type '.help'
    * Explore D2: type 'd2.<tab>'
            `)
            main(state)
        }
    }
    , err => console.error(err)
)

function exit () {
    console.log('\nAight, closing up shop. See you next time!')
    process.exit(0)
}

function main(state) {
    const r = repl.start(
        { writer: pp
        , prompt: '> '
        })

    Object.defineProperty
    ( r.context
    , 'd2'
    , { configurable: false
      , enumerable: true
      , value: state.d2
      }
    )

    Object.defineProperty
    ( r.context
    , 'rx'
    , { configurable: false
      , enumerable: true
      , value: Rx
      }
    )
}

function pp (thing) {
    return util.inspect(thing, { showHidden: false, depth: 0, colors: true })
}
