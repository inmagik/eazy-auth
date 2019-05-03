import makeAuthFlow from '../auth/saga'
import configureStore from 'redux-mock-store'
import createSagaMiddleware from 'redux-saga'

const mockStoreWithSaga = (saga, ...mockStoreArgs) => {
  const sagaMiddleware = createSagaMiddleware()
  const middlewares = [sagaMiddleware]
  const mockStore = configureStore(middlewares)
  const store = mockStore(...mockStoreArgs)
  sagaMiddleware.run(saga)
  return store
}

describe('authApiCallFromStore-test', () => {
  it('should call api and returning a promise', done => {
    const loginCall = jest.fn()
    const refreshTokenCall = jest.fn(() =>
      Promise.resolve({
        access_token: 23,
        refresh_token: 777,
      })
    )
    const meCall = jest.fn()

    const api = jest.fn(token => () => {
      if (token === 23) {
        return Promise.resolve('Gio Va')
      }
      return Promise.reject({ status: 401 })
    })

    const { authFlow, authApiCallFromStore } = makeAuthFlow({
      loginCall,
      refreshTokenCall,
      meCall,
    })

    const store = mockStoreWithSaga(authFlow, {
      auth: {
        accessToken: 32,
        refreshToken: 777,
      },
    })
    const apiCall = authApiCallFromStore(store)

    apiCall(api).then(result => {
      expect(refreshTokenCall).toHaveBeenLastCalledWith(777)
      expect(api).toHaveBeenNthCalledWith(1, 32)
      expect(api).toHaveBeenNthCalledWith(2, 23)
      expect(result).toBe('Gio Va')
      expect(store.getActions()).toEqual([
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_START' },
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_END' },
        {
          type: '@@eazy-auth/TOKEN_REFRESHED',
          payload: { accessToken: 23, refreshToken: 777, expires: null },
        },
      ])
      done()
    })
  })
})
