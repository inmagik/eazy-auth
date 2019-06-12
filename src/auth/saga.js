import {
  take,
  call,
  put,
  select,
  fork,
  cancel,
  delay,
} from 'redux-saga/effects'
import {
  LOGIN,
  LOGIN_LOADING,
  LOGIN_FAILURE,
  LOGIN_SUCCESS,
  BOOTSTRAP_AUTH_START,
  BOOTSTRAP_AUTH_END,
  AUTH_WITH_TOKEN_LOADING,
  AUTH_WITH_TOKEN_FAILURE,
  AUTH_WITH_TOKEN_SUCCESS,
  LOGOUT,
  logout,
  tokenRefreshed,
  tokenRefreshing,
} from './actions'
// import makeAuthApiCallFromStore from './makeAuthApiCallFromStore'
import makeAuthMiddlewareInternal from './authMiddleware'

const defaultMakeErrorFromException = ex => ex

const noopStorageBackend = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

const makeAuth = ({
  // Do the me call using after login to get
  meCall,
  loginCall,
  refreshTokenCall,
  storageBackend,
  reduxMountPoint = 'auth',
  localStorageNamespace = 'auth',
  makeErrorFromException = defaultMakeErrorFromException,
}) => {
  let choosedStoageBackend
  if (typeof storageBackend === 'undefined' || storageBackend === null) {
    if (
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    ) {
      // If provided by environment use local storage
      choosedStoageBackend = window.localStorage
    } else {
      // Use a noop storage backend (don't store anything)
      choosedStoageBackend = noopStorageBackend
    }
  } else {
    // When given use provided storage backend
    choosedStoageBackend = storageBackend
  }

  // redux saga helpers for Stroage Backend
  function* ls(method, ...args) {
    try {
      return yield call([choosedStoageBackend, method], ...args)
    } catch (e) {
      // Such shitty friend like mobile safari anonymous navigaton
      // kill trhows exception when trying to write on local storage
      // this prevent a runtime error
      console.error('Error while accessing local storage', e)
    }
  }
  // Get from local storage
  function* lsGetAccessToken() {
    const rawToken = yield ls('getItem', `${localStorageNamespace}:accessToken`)
    try {
      return JSON.parse(rawToken)
    } catch (e) {
      return null
    }
  }
  function* lsGetRefreshToken() {
    const rawToken = yield ls(
      'getItem',
      `${localStorageNamespace}:refreshToken`
    )
    try {
      return JSON.parse(rawToken)
    } catch (e) {
      return null
    }
  }
  function* lsGetExpires() {
    const expiresAndTimestamp = yield ls(
      'getItem',
      `${localStorageNamespace}:expires`
    )
    if (expiresAndTimestamp) {
      const timestamp = parseInt(new Date().getTime() / 1000, 10)
      const [relativeExpires, realtiveTimestamp] = expiresAndTimestamp.split(
        ','
      )
      return (
        parseInt(relativeExpires, 10) -
        (timestamp - parseInt(realtiveTimestamp, 10))
      )
    }
    return null
  }
  // Store to local storage
  function* lsStoreAccessToken(token) {
    const jsonToken =
      typeof token === 'undefined' ? 'null' : JSON.stringify(token)
    yield ls('setItem', `${localStorageNamespace}:accessToken`, jsonToken)
  }
  function* lsStoreRefreshToken(token) {
    const jsonToken =
      typeof token === 'undefined' ? 'null' : JSON.stringify(token)
    yield ls('setItem', `${localStorageNamespace}:refreshToken`, jsonToken)
  }
  function* lsStoreExpires(expires) {
    // Store along seconds timestamp...
    const timestamp = parseInt(new Date().getTime() / 1000, 10)
    yield ls(
      'setItem',
      `${localStorageNamespace}:expires`,
      `${expires},${timestamp}`
    )
  }
  // Remove from local storage
  function* lsRemoveAccessToken(token) {
    yield ls('removeItem', `${localStorageNamespace}:accessToken`)
  }
  function* lsRemoveRefreshToken(token) {
    yield ls('removeItem', `${localStorageNamespace}:refreshToken`)
  }
  function* lsRemoveExpires(token) {
    yield ls('removeItem', `${localStorageNamespace}:expires`)
  }
  function* lsRemoveTokens() {
    yield lsRemoveAccessToken()
    yield lsRemoveRefreshToken()
    yield lsRemoveExpires()
  }

  // redux saga helpers for getting tokens from redux store
  const selectAuth = state => state[reduxMountPoint]
  function* getAccessToken() {
    return yield select(state => selectAuth(state).accessToken)
  }
  function* getRefreshToken() {
    return yield select(state => selectAuth(state).refreshToken)
  }
  function* getTokenExpires() {
    return yield select(state => selectAuth(state).expires)
  }

  function* apiCallWithRefresh(accessToken, refreshToken, apiFn, ...args) {
    try {
      const result = yield call(apiFn(accessToken), ...args)
      // Response ok no need to refresh
      return [result, { accessToken, refreshToken, refreshed: false }]
    } catch (error) {
      // No refresh function given throw the original error
      if (typeof refreshTokenCall !== 'function') {
        throw error
      }
      // refresh token and retry the call
      if (error.status === 401) {
        let refresh
        yield put(tokenRefreshing())
        try {
          refresh = yield call(refreshTokenCall, refreshToken)
        } catch (_) {
          // Fuck off if the refresh call fails throw the original 401 error
          throw error
        }
        const result = yield call(apiFn(refresh.access_token), ...args)
        return [
          result,
          {
            accessToken: refresh.access_token,
            refreshToken: refresh.refresh_token,
            expires: refresh.expires,
            refreshed: true,
          },
        ]
      } else {
        // Normal error handling
        throw error
      }
    }
  }

  // make an auth api call (curry given or taken from store accessToken)
  function* authApiCall(apiFn, ...args) {
    const accessToken = yield getAccessToken()
    const refreshToken = yield getRefreshToken()

    try {
      const [result, refresh] = yield apiCallWithRefresh(
        accessToken,
        refreshToken,
        apiFn,
        ...args
      )
      if (refresh && refresh.refreshed) {
        yield lsStoreAccessToken(refresh.accessToken)
        yield lsStoreRefreshToken(refresh.refreshToken)
        if (refresh.expires) {
          yield lsStoreExpires(refresh.expires)
        }
        yield put(tokenRefreshed(refresh))
      }
      return result
    } catch (error) {
      if (error.status === 401) {
        yield put(logout())
      }
      if (error.status === 403) {
        yield put(logout({ fromPermission: true }))
      }
      throw error
    }
  }

  function* authenticateWithStorageToken() {
    // Access toke from local storage
    yield put({ type: BOOTSTRAP_AUTH_START })
    const lsAccessToken = yield lsGetAccessToken()
    const lsRefreshToken = yield lsGetRefreshToken()
    if (lsAccessToken) {
      yield put({ type: AUTH_WITH_TOKEN_LOADING })
      try {
        // Curried me
        const me = token => () => meCall(token)
        const [
          user,
          { accessToken, refreshToken, expires: refreshExpires, refreshed },
        ] = yield apiCallWithRefresh(lsAccessToken, lsRefreshToken, me)

        let expires
        // Save new tokens in storage when me call was refreshed
        if (refreshed) {
          expires = refreshExpires
          yield lsStoreAccessToken(accessToken)
          yield lsStoreRefreshToken(refreshToken)
          if (expires) {
            yield lsStoreExpires(expires)
          }
        } else {
          expires = yield lsGetExpires()
        }
        // Save tokens and user info in redux store
        yield put({
          type: AUTH_WITH_TOKEN_SUCCESS,
          payload: { user, accessToken, refreshToken, expires },
        })
      } catch (e) {
        yield put({
          type: AUTH_WITH_TOKEN_FAILURE,
          error: makeErrorFromException(e),
        })
        // The token was wrong...
        yield lsRemoveTokens()
      }
    }
    yield put({ type: BOOTSTRAP_AUTH_END })
  }

  // Watch login action and then try to authenticate user with given
  // credentials, if ok store tokens
  function* watchLogin() {
    const { payload } = yield take(LOGIN)
    const { credentials } = payload
    yield put({ type: LOGIN_LOADING })
    try {
      const loginResponse = yield call(loginCall, credentials)
      const { access_token, refresh_token, expires = null } = loginResponse
      // Using access token to get user info
      // ... passing additional param loginResponse over access_token
      // to get for example the user info from login response rather than
      // the me api endpoint
      const user = yield call(meCall, access_token, loginResponse)
      // Store tokens
      yield lsStoreAccessToken(access_token)
      yield lsStoreRefreshToken(refresh_token)
      if (expires) {
        yield lsStoreExpires(expires)
      }
      // Notify redux store login is ok!
      yield put({
        type: LOGIN_SUCCESS,
        payload: {
          user,
          expires,
          accessToken: access_token,
          refreshToken: refresh_token,
        },
      })
    } catch (e) {
      yield put({
        type: LOGIN_FAILURE,
        error: makeErrorFromException(e),
      })
    }
  }

  // Wait logout action and then remove tokens from storage
  function* watchLogout() {
    yield take(LOGOUT)
    yield lsRemoveTokens()
  }

  // Wait expiration and try to rehresh token!
  function* refreshOnExpirationLoop() {
    while (true) {
      const expires = yield getTokenExpires()
      yield delay(1000 * expires)

      const refreshToken = yield getRefreshToken()
      yield put(tokenRefreshing())
      try {
        // Try to refresh token after waiting expiration
        const refresh = yield call(refreshTokenCall, refreshToken)
        // Write to local storage...
        yield lsStoreAccessToken(refresh.access_token)
        yield lsStoreRefreshToken(refresh.refresh_token)
        yield lsStoreExpires(refresh.expires)
        // Save in redux state
        yield put(
          tokenRefreshed({
            expires: refresh.expires,
            accessToken: refresh.access_token,
            refreshToken: refresh.refresh_token,
          })
        )
      } catch (error) {
        yield put(logout())
      }
    }
  }

  // le Auth flow saga
  function* authFlow() {
    // try to authenticate using current local storage token
    yield authenticateWithStorageToken()
    // when authenticated wait for logout action
    if (yield getAccessToken()) {
      let refreshTokenTask
      if (yield getTokenExpires()) {
        refreshTokenTask = yield fork(refreshOnExpirationLoop)
      }
      yield watchLogout()
      if (refreshTokenTask) {
        yield cancel(refreshTokenTask)
      }
    }

    // endless auth loop login -> auth -> logout -> login -> ...
    while (true) {
      // wait for login
      yield watchLogin()
      // if login ok user is authenticated now wait for logout
      if (yield getAccessToken()) {
        let refreshTokenTask
        if (yield getTokenExpires()) {
          refreshTokenTask = yield fork(refreshOnExpirationLoop)
        }
        yield watchLogout()
        if (refreshTokenTask) {
          yield cancel(refreshTokenTask)
        }
      }
    }
  }

  function makeAuthMiddleware() {
    return makeAuthMiddlewareInternal({
      meCall,
      loginCall,
      refreshTokenCall,
      storageBackend,
      reduxMountPoint,
      localStorageNamespace,
      makeErrorFromException,
    })
  }

  // function authApiCallFromStore(store) {
  //   return makeAuthApiCallFromStore(
  //     {
  //       meCall,
  //       loginCall,
  //       refreshTokenCall,
  //       storageBackend,
  //       reduxMountPoint,
  //       localStorageNamespace,
  //       makeErrorFromException,
  //     },
  //     store
  //   )
  // }

  return {
    authFlow,
    authApiCall,
    makeAuthMiddleware,
    // authApiCallFromStore,
  }
}

export default makeAuth
