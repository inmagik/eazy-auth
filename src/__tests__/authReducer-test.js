import configureStore from 'redux-mock-store'
import createSagaMiddleware from 'redux-saga'
import { fork } from 'redux-saga/effects'

const sagaMiddleware = createSagaMiddleware()
const middlewares = [sagaMiddleware]
const mockStore = configureStore(middlewares)

import { makeAuthFlow, login } from '../auth'
import { LOGIN_LOADING, LOGIN } from '../auth/actions'

const TOKENS = {
  access_token: 'G$OV4',
  refreshToken: 'FUM3LL0',
}

const USER = {
  username: 'giova',
  id: 69,
  admin: true,
}

test('yeah', () => {
  const initialState = {}
  const store = mockStore(initialState)

  const { authFlow, authCall } = makeAuthFlow({
    // makeErrorFromException: ({ data }) => data.error,
    loginCall: () => Promise.resolve(TOKENS),
    meCall: () => Promise.resolve(USER),
  })
  function* mainSaga() {
    yield fork(authFlow)
  }
  sagaMiddleware.run(mainSaga)

  const credentials = {
    username: 'giova',
    password: 'fumello',
  }
  store.dispatch(login(credentials))

  // expect(store.getActions()).toEqual([
  //   {
  //     type: LOGIN,
  //     payload: credentials,
  //   },
  //   {
  //     type: LOGIN_LOADING,
  //   }
  // ])
  console.log(store.getActions())

  // expect(1 + 2).toBe(3)
  // store.dispatch(login({ u }))

  // .....~~~~
  // -->
})
