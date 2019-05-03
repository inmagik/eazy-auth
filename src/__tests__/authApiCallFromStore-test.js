import makeAuthFlow from '../auth/saga'
import configureStore from 'redux-mock-store'
import createSagaMiddleware from 'redux-saga'

const noopStorageBackend = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

const mockStoreWithSaga = (saga, ...mockStoreArgs) => {
  const sagaMiddleware = createSagaMiddleware()
  const middlewares = [sagaMiddleware]
  const mockStore = configureStore(middlewares)
  const store = mockStore(...mockStoreArgs)
  sagaMiddleware.run(saga)
  return store
}

describe('authApiCallFromStore-test', () => {
  it('should call api with token and refresh it', done => {
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
      storageBackend: noopStorageBackend,
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

  it('should call api with token and logout on 401', done => {
    const loginCall = jest.fn()
    const meCall = jest.fn()

    const api = jest.fn(token => () => {
      return Promise.reject({ status: 401 })
    })

    const { authFlow, authApiCallFromStore } = makeAuthFlow({
      loginCall,
      meCall,
      storageBackend: noopStorageBackend,
    })

    const store = mockStoreWithSaga(authFlow, {
      auth: {
        accessToken: 32,
        refreshToken: null,
      },
    })
    const apiCall = authApiCallFromStore(store)

    apiCall(api).catch(error => {
      expect(api).toHaveBeenNthCalledWith(1, 32)
      expect(error).toEqual({
        status: 401,
      })
      expect(store.getActions()).toEqual([
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_START' },
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_END' },
        {
          type: '@@eazy-auth/LOGOUT',
          payload: { fromPermission: false },
        },
      ])
      done()
    })
  })
  it('should call api with token and logout on 401 and bad refresh', done => {
    const refreshTokenCall = jest.fn(() => Promise.reject('ahhahaha'))
    const loginCall = jest.fn()
    const meCall = jest.fn()

    const api = jest.fn(token => () => {
      return Promise.reject({ status: 401 })
    })

    const { authFlow, authApiCallFromStore } = makeAuthFlow({
      refreshTokenCall,
      loginCall,
      meCall,
      storageBackend: noopStorageBackend,
    })

    const store = mockStoreWithSaga(authFlow, {
      auth: {
        accessToken: 32,
        refreshToken: 777,
      },
    })
    const apiCall = authApiCallFromStore(store)

    apiCall(api).catch(error => {
      expect(api).toHaveBeenNthCalledWith(1, 32)
      expect(refreshTokenCall).toHaveBeenLastCalledWith(777)
      expect(error).toEqual({
        status: 401,
      })
      expect(store.getActions()).toEqual([
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_START' },
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_END' },
        {
          type: '@@eazy-auth/LOGOUT',
          payload: { fromPermission: false },
        },
      ])
      done()
    })
  })
})
