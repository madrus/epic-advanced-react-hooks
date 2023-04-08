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
function useAsync(asyncFetchCallback, initialState) {
  const [state, dispatch] = React.useReducer(asyncReducer, {
    status: 'idle',
    data: null,
    error: null,
    ...initialState,
  })

  /**
   * useEffect is memoized based on asyncFetchCallback
   * which is memoized based on pokemonName
   */
  React.useEffect(() => {
    // we call asyncFetchCallback immediately to let the hooks user a chance to return early
    const promise = asyncFetchCallback()
    if (!promise) {
      // this check will help us return early if no promise
      return
    }
    // then you can dispatch and handle the promise etc...
    dispatch({type: 'pending'})
    // we have a promise, let's handle it
    promise.then(
      data => {
        dispatch({type: 'resolved', data})
      },
      error => {
        dispatch({type: 'rejected', error})
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asyncFetchCallback])

  return state
}

/**
 * asyncFetchCallback is memoized based on pokemonName
 * @param {*} param0
 * @returns
 */
function PokemonInfo({pokemonName}) {
  const asyncFetchCallback = React.useCallback(() => {
    if (!pokemonName) {
      // this will trigger the return early from useAsync
      return
    }
    return fetchPokemon(pokemonName)
  }, [pokemonName])

  // 🐨 here's how you'll use the new useAsync hook you're writing:
  const state = useAsync(asyncFetchCallback, {
    status: pokemonName ? 'pending' : 'idle',
  })

  const {data: pokemon, status, error} = state

  switch (status) {
    case 'idle':
      return <span>Submit a pokemon</span>
    case 'pending':
      return <PokemonInfoFallback name={pokemonName} />
    case 'rejected':
      throw error
    case 'resolved':
      return <PokemonDataView pokemon={pokemon} />
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
