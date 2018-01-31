import { take, call, put, select } from 'redux-saga/effects'
import {
  LOGIN,
  LOGIN_LOADING,
  LOGIN_FAILURE,
  LOGIN_SUCCESS,
  AUTH_WITH_TOKEN_LOADING,
  AUTH_WITH_TOKEN_FAILURE,
  AUTH_WITH_TOKEN_SUCCESS,
  LOGOUT,
  logout,
  tokenRefreshed,
} from './actions'

const defaultMakeErrorFromException = ex =>
  !ex ? null : ex.message ? ex.message : ex

const makeAuth = ({
  // Do the me call using after login to get
  meCall,
  loginCall,
  refreshTokenCall,
  localStorageNamespace = 'auth',
  makeErrorFromException = defaultMakeErrorFromException,
}) => {

  // redux saga helpers for Local Storage
  function *ls(method, ...args) {
    try {
      return yield call([window.localStorage, method], ...args)
    } catch (e) {
      // Such shitty friend like mobile safari anonymous navigaton
      // kill trhows exception when trying to write on local storage
      // this prevent a runtime error
      console.error('Error while accessing local storage', e)
    }
  }
  function *lsGetAccessToken() {
    return yield ls('getItem', `${localStorageNamespace}:accessToken`)
  }
  function *lsGetRefreshToken() {
    return yield ls('getItem', `${localStorageNamespace}:refreshToken`)
  }
  function *lsStoreAccessToken(token) {
    yield ls('setItem', `${localStorageNamespace}:accessToken`, token)
  }
  function *lsStoreRefreshToken(token) {
    yield ls('setItem', `${localStorageNamespace}:refreshToken`, token)
  }
  function *lsRemoveAccessToken(token) {
    yield ls('removeItem', `${localStorageNamespace}:accessToken`)
  }
  function *lsRemoveRefreshToken(token) {
    yield ls('removeItem', `${localStorageNamespace}:refreshToken`)
  }
  function *lsRemoveTokens() {
    yield lsRemoveAccessToken()
    yield lsRemoveRefreshToken()
  }

  // redux saga helpers for getting tokens from redux store
  // TODO: Maybe in future we can provide custom store key
  const selectAuth = state => state.auth
  function *getAccessToken() {
    return yield select(state => selectAuth(state).accessToken)
  }
  function *getRefreshToken() {
    return yield select(state => selectAuth(state).refreshToken)
  }

  function* apiCallWithRefresh(accessToken, refreshToken, apiFn, ...args) {
    try {
      const result = yield call(apiFn(accessToken), ...args)
      // Response ok no need to refresh
      return [result, { accessToken, refreshToken }]
    } catch (error) {
      // No refresh function given throw the original error
      if (typeof refreshTokenCall !== 'function') {
        throw error
      }
      // refresh token and retry the call
      if (error.status === 401) {
        let refresh
        try {
          refresh = yield call(refreshTokenCall, refreshToken)
        } catch (_) {
          // Fuck off if the refresh call fails throw the original 401 error
          throw error
        }
        const result = yield call(apiFn(refresh.access_token), ...args)
        return [result, { accessToken: refresh.access_token, refreshToken: refresh.refresh_token }]
      } else {
        // Normal error handling
        throw error
      }
    }
  }

  // make an auth api call (curry given or taken from store accessToken)
  function* authApiCall(apiFn, ...args) {
    const accessToken =  yield getAccessToken()
    const refreshToken =  yield getRefreshToken()

    try {
      const [result, refresh] = yield apiCallWithRefresh(accessToken, refreshToken, apiFn, ...args)
      if (refresh) {
        yield lsStoreAccessToken(refresh.accessToken)
        yield lsStoreRefreshToken(refresh.refreshToken)
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
    const lsAccessToken = yield lsGetAccessToken()
    const lsRefreshToken = yield lsGetRefreshToken()
    if (lsAccessToken) {
      yield put({ type: AUTH_WITH_TOKEN_LOADING })
      try {
        // Curried me
        const me = token => () => meCall(token)
        const [
          user,
          { accessToken, refreshToken }
        ] = yield apiCallWithRefresh(lsAccessToken, lsRefreshToken, me)
        // Save tokens and user info in redux store
        yield put({
          type: AUTH_WITH_TOKEN_SUCCESS,
          payload: { user, accessToken, refreshToken }
        })
      } catch (e) {
        yield put({
          type: AUTH_WITH_TOKEN_FAILURE,
          error: makeErrorFromException(e)
        })
        // The token was wrong...
        yield lsRemoveTokens()
      }
    }
  }

  // Watch login action and then try to authenticate user with given
  // credentials, if ok store tokens
  function* watchLogin() {
    const { payload } = yield take(LOGIN)
    const { credentials } = payload
    yield put({ type: LOGIN_LOADING })
    try {
      const { access_token, refresh_token } = yield call(loginCall, credentials)
      // Using access token to get user info
      const user = yield call(meCall, access_token)
      // Store tokens
      yield lsStoreAccessToken(access_token)
      yield lsStoreRefreshToken(refresh_token)
      // Notify redux store login is ok!
      yield put({
        type: LOGIN_SUCCESS,
        payload: {
          user,
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

  // le Auth flow saga
  function* authFlow() {
    // try to authenticate using current local storage token
    yield authenticateWithStorageToken()
    // when authenticated wait for logout action
    if (yield getAccessToken()) {
      yield watchLogout()
    }

    // endless auth loop login -> auth -> logout -> login -> ...
    while (true) {
      // wait for login
      yield watchLogin()
      // if login ok user is authenticated now wait for logout
      if (yield getAccessToken()) {
        yield watchLogout()
      }
    }
  }

  return {
    authFlow,
    authApiCall,
  }
}

export default makeAuth
