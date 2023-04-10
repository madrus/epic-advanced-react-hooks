// useCallback: custom hooks
// http://localhost:3000/isolated/exercise/02.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonForm,
  PokemonDataView,
  PokemonInfoFallback,
  PokemonErrorBoundary,
} from '../pokemon'

// 🐨 this is going to be our generic asyncReducer
function asyncReducer(state, action) {
  switch (action.type) {
    case 'pending': {
      return {status: 'pending', data: null, error: null}
    }
    case 'resolved': {
      return {status: 'resolved', data: action.data, error: null}
    }
    case 'rejected': {
      return {status: 'rejected', data: null, error: action.error}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

/**
 *
 * @param {*} asyncFetchCallback our async thing
 * @param {*} initialState
 * @param {*} dependencies when we want our asyncFetchCallback be re-called
 * @returns a Promise of data
 */
function useAsync(initialState, ref) {
  const [state, dispatch] = React.useReducer(asyncReducer, {
    status: 'idle',
    data: null,
    error: null,
    ...initialState,
  })

  const run = React.useCallback(
    promise => {
      if (!promise) {
        return
      }

      console.log('game started!')
      dispatch({type: 'pending'})

      promise.then(
        data => {
          if (!ref.current) {
            console.log('no more ref')
            return
          }
          dispatch({type: 'resolved', data})
        },
        error => {
          if (error.name === 'AbortError') {
            console.log('fetch aborted')
            return
          } else {
            console.log('fetch rejected')
            dispatch({type: 'rejected', error})
          }
        },
      )
    },
    [ref],
  )

  React.useEffect(() => {
    console.log('innerHTML', ref.current?.innerHTML)
    return () => (ref.current = null)
  }, [ref])

  return {...state, run}
}

/**
 * asyncFetchCallback is memoized based on pokemonName
 * @param {*} param0
 * @returns
 */
function PokemonInfo({pokemonName}) {
  const infoRef = React.useRef()

  const {
    data: pokemon,
    status,
    error,
    run,
  } = useAsync(
    {
      status: pokemonName ? 'pending' : 'idle',
    },
    infoRef,
  )

  React.useEffect(() => {
    if (!pokemonName) {
      return
    }

    const pokemonPromise = fetchPokemon(pokemonName)
    const runTimeout = setTimeout(() => run(pokemonPromise), 3000)
    return () => clearTimeout(runTimeout)
  }, [pokemonName, run])

  React.useEffect(() => {
    //! This useEffect is necessary to initialized infoRef
    // console.log('infoRef.current: <<', infoRef.current, '>>')
  }, [])

  switch (status) {
    case 'idle':
      return (
        <div ref={infoRef}>
          <span>Submit a pokemon</span>
        </div>
      )
    case 'pending':
      return (
        <div ref={infoRef}>
          <PokemonInfoFallback name={pokemonName} />
        </div>
      )
    case 'rejected':
      throw error
    case 'resolved':
      return (
        <div ref={infoRef}>
          <PokemonDataView pokemon={pokemon} />
        </div>
      )
    default:
      throw new Error('This should be impossible')
  }
}

function App() {
  const [pokemonName, setPokemonName] = React.useState('')

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleReset() {
    setPokemonName('')
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className="pokemon-info">
        <PokemonErrorBoundary onReset={handleReset} resetKeys={[pokemonName]}>
          <PokemonInfo pokemonName={pokemonName} />
        </PokemonErrorBoundary>
      </div>
    </div>
  )
}

function AppWithUnmountCheckbox() {
  const [mountApp, setMountApp] = React.useState(true)
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={mountApp}
          onChange={e => setMountApp(e.target.checked)}
        />{' '}
        Mount Component
      </label>
      <hr />
      {mountApp ? <App /> : null}
    </div>
  )
}

export default AppWithUnmountCheckbox
