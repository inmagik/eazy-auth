import { createStore, compose, applyMiddleware, combineReducers } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { fork } from 'redux-saga/effects'
import { omit, find } from 'lodash'
import users from './users'

import { makeAuthReducer, makeAuthFlow } from 'eazy-auth'

const rootReducer = combineReducers({
  auth: makeAuthReducer(
    /**
      Optional reducer middleware:
      (prevState, action, actuallyAuthReducer) =>
        // Do whatever you want
        actuallyAuthReducer(prevState, action)
    **/
  ),
})

const TOKEN = '__COOLEST__TOKEN__IN__THE_F***KIN_WORLD~'

// A function that return a promise whit logi respose
const loginCall = ({ username, password }) => new Promise((resolve, reject) => {
  setTimeout(() => {
    const user = find(users, { username, password })

    if (user) {
      resolve({
        access_token: username,
        refresh_token: username
      })
    } else {
      reject({
        status: 400,
        data: {
          error: 'Bad credentials'
        }
      })
    }
  }, 1000)
})

const refreshTokenCall = username => new Promise(resolve => {
  console.log('Call refresh', username)
  resolve({ access_token: `${TOKEN}${username}`, refresh_token: 777 })
})

// Token --> User data if me is performed after a login call
// loginData was provided as additional argument...
const meCall = (token, loginData) => new Promise((resolve, reject) => {
  setTimeout(() => {
    let user
    let search
    const parts = token.split(TOKEN)
    if (loginData) {
      search = parts[0]
    } else {
      search = parts[1]
    }
    user = find(users, { username: search })

    if (user) {
      resolve(omit(user, 'password'))
    } else {
      reject({
        status: 401,
        data: {
          error: 'BAD TOKEN'
        }
      })
    }
  }, 200)
})

const { authFlow, makeAuthMiddleware } = makeAuthFlow({
  makeErrorFromException: ({ data }) => data.error,
  loginCall,
  refreshTokenCall,
  meCall,
})
const authMiddleware = makeAuthMiddleware()

function *mainSaga() {
  yield fork(authFlow)
}

const sagaMiddleware = createSagaMiddleware()
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
const store = createStore(
  rootReducer,
  undefined,
  composeEnhancers(
    applyMiddleware(sagaMiddleware, authMiddleware),
  )
)
export const { callAuthApiObservable } = authMiddleware.run()
sagaMiddleware.run(mainSaga)

export default store
