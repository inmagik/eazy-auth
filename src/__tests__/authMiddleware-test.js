import makeAuthFlow from '../auth/saga'
import configureStore from 'redux-mock-store'
import createSagaMiddleware from 'redux-saga'

const noopStorageBackend = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
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

    const { authFlow, makeAuthMiddleware } = makeAuthFlow({
      loginCall,
      refreshTokenCall,
      meCall,
      storageBackend: noopStorageBackend,
    })

    const authMiddleware = makeAuthMiddleware()
    const sagaMiddleware = createSagaMiddleware()
    const mockStore = configureStore([sagaMiddleware, authMiddleware])
    const store = mockStore({
      auth: {
        authBooted: true,
        accessToken: 32,
        refreshToken: 777,
      },
    })
    const { callAuthApiPromise } = authMiddleware.run()
    sagaMiddleware.run(authFlow)

    callAuthApiPromise(api).then(result => {
      expect(refreshTokenCall).toHaveBeenLastCalledWith(777)
      expect(api).toHaveBeenNthCalledWith(1, 32)
      expect(api).toHaveBeenNthCalledWith(2, 23)
      expect(result).toBe('Gio Va')
      expect(store.getActions()).toEqual([
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_START' },
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_END' },
        { type: '@@eazy-auth/TOKEN_REFRESHING' },
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

    const { authFlow, makeAuthMiddleware } = makeAuthFlow({
      loginCall,
      meCall,
      storageBackend: noopStorageBackend,
    })

    const authMiddleware = makeAuthMiddleware()
    const sagaMiddleware = createSagaMiddleware()
    const mockStore = configureStore([sagaMiddleware, authMiddleware])
    const store = mockStore({
      auth: {
        authBooted: true,
        accessToken: 32,
        refreshToken: null,
      },
    })
    const { callAuthApiPromise } = authMiddleware.run()
    sagaMiddleware.run(authFlow)

    callAuthApiPromise(api).catch(error => {
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
  it('should call api with token and logout with fromPermission true on 403', done => {
    const loginCall = jest.fn()
    const meCall = jest.fn()

    const api = jest.fn(token => () => {
      return Promise.reject({ status: 403 })
    })

    const { authFlow, makeAuthMiddleware } = makeAuthFlow({
      loginCall,
      meCall,
      storageBackend: noopStorageBackend,
    })

    const authMiddleware = makeAuthMiddleware()
    const sagaMiddleware = createSagaMiddleware()
    const mockStore = configureStore([sagaMiddleware, authMiddleware])
    const store = mockStore({
      auth: {
        authBooted: true,
        accessToken: 32,
        refreshToken: null,
      },
    })
    const { callAuthApiPromise } = authMiddleware.run()
    sagaMiddleware.run(authFlow)

    callAuthApiPromise(api).catch(error => {
      expect(api).toHaveBeenNthCalledWith(1, 32)
      expect(error).toEqual({
        status: 403,
      })
      expect(store.getActions()).toEqual([
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_START' },
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_END' },
        {
          type: '@@eazy-auth/LOGOUT',
          payload: { fromPermission: true },
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

    const { authFlow, makeAuthMiddleware } = makeAuthFlow({
      refreshTokenCall,
      loginCall,
      meCall,
      storageBackend: noopStorageBackend,
    })

    const authMiddleware = makeAuthMiddleware()
    const sagaMiddleware = createSagaMiddleware()
    const mockStore = configureStore([sagaMiddleware, authMiddleware])
    const store = mockStore({
      auth: {
        authBooted: true,
        accessToken: 32,
        refreshToken: 777,
      },
    })
    const { callAuthApiPromise } = authMiddleware.run()
    sagaMiddleware.run(authFlow)

    callAuthApiPromise(api).catch(error => {
      expect(api).toHaveBeenNthCalledWith(1, 32)
      expect(refreshTokenCall).toHaveBeenLastCalledWith(777)
      expect(error).toEqual({
        fromRefresh: true,
        status: 401,
      })
      expect(store.getActions()).toEqual([
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_START' },
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_END' },
        { type: '@@eazy-auth/TOKEN_REFRESHING' },
        {
          type: '@@eazy-auth/LOGOUT',
          payload: { fromPermission: false },
        },
      ])
      done()
    })
  })
  it('should call the refresh only once when multiple calls got 401', done => {
    const loginCall = jest.fn()
    const refreshTokenCall = jest.fn(() =>
      Promise.resolve({
        access_token: 23,
        refresh_token: 777,
      })
    )
    const meCall = jest.fn().mockResolvedValue('XD')

    const api = jest.fn(token => () => {
      if (token === 23) {
        return Promise.resolve('Gio Va')
      }
      return Promise.reject({ status: 401 })
    })

    const { authFlow, makeAuthMiddleware } = makeAuthFlow({
      loginCall,
      refreshTokenCall,
      meCall,
      storageBackend: noopStorageBackend,
    })

    const authMiddleware = makeAuthMiddleware()
    const sagaMiddleware = createSagaMiddleware()
    const mockStore = configureStore([sagaMiddleware, authMiddleware])
    const store = mockStore({
      auth: {
        authBooted: true,
        accessToken: 32,
        refreshToken: 777,
      },
    })
    const { callAuthApiPromise } = authMiddleware.run()
    sagaMiddleware.run(authFlow)

    callAuthApiPromise(api)
    callAuthApiPromise(api)
    callAuthApiPromise(api)
    .then(result => {
      expect(refreshTokenCall).toHaveBeenLastCalledWith(777)
      expect(api).toHaveBeenNthCalledWith(1, 32)
      expect(api).toHaveBeenNthCalledWith(2, 32)
      expect(api).toHaveBeenNthCalledWith(3, 32)
      expect(api).toHaveBeenNthCalledWith(4, 23)
      expect(api).toHaveBeenNthCalledWith(5, 23)
      expect(api).toHaveBeenNthCalledWith(6, 23)
      expect(refreshTokenCall).toBeCalledTimes(1)
      expect(result).toBe('Gio Va')
      expect(store.getActions()).toEqual([
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_START' },
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_END' },
        { type: '@@eazy-auth/TOKEN_REFRESHING' },
        {
          type: '@@eazy-auth/TOKEN_REFRESHED',
          payload: { accessToken: 23, refreshToken: 777, expires: null },
        },
      ])
      done()
    })
  })
  it('should call the refresh only once when multiple calls got 401, also working with observables', done => {
    const loginCall = jest.fn()
    const refreshTokenCall = jest.fn(() =>
      Promise.resolve({
        access_token: 23,
        refresh_token: 777,
      })
    )
    const meCall = jest.fn().mockResolvedValue('XD')

    const api = jest.fn(token => () => {
      if (token === 23) {
        return Promise.resolve('Gio Va')
      }
      return Promise.reject({ status: 401 })
    })

    const { authFlow, makeAuthMiddleware } = makeAuthFlow({
      loginCall,
      refreshTokenCall,
      meCall,
      storageBackend: noopStorageBackend,
    })
    const authMiddleware = makeAuthMiddleware()
    const sagaMiddleware = createSagaMiddleware()
    const mockStore = configureStore([sagaMiddleware, authMiddleware])
    const store = mockStore({
      auth: {
        authBooted: true,
        accessToken: 32,
        refreshToken: 777,
      },
    })
    const { callAuthApiObservable } = authMiddleware.run()
    sagaMiddleware.run(authFlow)

    callAuthApiObservable(api).subscribe(() => {})
    callAuthApiObservable(api).subscribe(() => {})
    callAuthApiObservable(api)
    .subscribe(result => {
      expect(refreshTokenCall).toHaveBeenLastCalledWith(777)
      expect(api).toHaveBeenNthCalledWith(1, 32)
      expect(api).toHaveBeenNthCalledWith(2, 32)
      expect(api).toHaveBeenNthCalledWith(3, 32)
      expect(api).toHaveBeenNthCalledWith(4, 23)
      expect(api).toHaveBeenNthCalledWith(5, 23)
      expect(api).toHaveBeenNthCalledWith(6, 23)
      expect(refreshTokenCall).toBeCalledTimes(1)
      expect(result).toBe('Gio Va')
      expect(store.getActions()).toEqual([
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_START' },
        { type: '@@eazy-auth/BOOTSTRAP_AUTH_END' },
        { type: '@@eazy-auth/TOKEN_REFRESHING' },
        {
          type: '@@eazy-auth/TOKEN_REFRESHED',
          payload: { accessToken: 23, refreshToken: 777, expires: null },
        },
      ])
      done()
    })
  })
})
