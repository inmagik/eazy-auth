import { tokenRefreshed, logout } from './actions'
import { catchError, mergeMap, map } from 'rxjs/operators'
import { isObservable, throwError, from, of } from 'rxjs'

function proxyObservable($result, store, apiFn, args, {
  // Auth selectors
  getAccessToken,
  getRefreshToken,
  // Refresh API call
  refreshTokenCall,
  // Storage methods
  lsStoreAccessToken,
  lsStoreRefreshToken,
  lsStoreExpires,
}) {
  return $result.pipe(
    catchError(error => {
      if (error.status === 401) {
        if (typeof refreshTokenCall !== 'function') {
          // Log out ma men
          store.dispatch(logout())
          return throwError(error)
        }
        // Try refresing token...
        const refreshToken = getRefreshToken()
        // At this time access token is bad
        const badAccessToken = getAccessToken()

        return from(refreshTokenCall(refreshToken)).pipe(
          mergeMap(refresh => {
            // Re-try da call
            return apiFn(refresh.access_token)(...args).pipe(
              map(result => {
                // Notify store da refresh!
                if (getAccessToken() === badAccessToken) {
                  store.dispatch(
                    tokenRefreshed({
                      accessToken: refresh.access_token,
                      refreshToken: refresh.refresh_token,
                      expires: refresh.expires,
                    })
                  )
                  // Write lo local storage!
                  lsStoreAccessToken(refresh.access_token)
                  lsStoreRefreshToken(refresh.refresh_token)
                  if (refresh.expires) {
                    lsStoreExpires(refresh.expires)
                  }
                }
                // YEAH Go result!
                return of(result)
              }),
              catchError(() => {
                // The api fail again ....
                if (error.status === 401) {
                  store.dispatch(logout())
                } else if (error.status === 403) {
                  store.dispatch(logout({ fromPermission: true }))
                }
                return throwError(error)
              })
            )
          }),
          catchError(() => {
            // Fuck off if the refresh call fails throw the original 401 error
            // Logout ma men
            store.dispatch(logout())
            // Original 401
            return throwError(error)
          })
        )
      } else {
        if (error.status === 403) {
          store.dispatch(logout({ fromPermission: true }))
        }
        // Normal error handling
        return throwError(error)
      }
    })
  )
}

function proxyPromise(promiseResult, store, apiFn, args, {
  // Auth selectors
  getAccessToken,
  getRefreshToken,
  // Refresh API call
  refreshTokenCall,
  // Storage methods
  lsStoreAccessToken,
  lsStoreRefreshToken,
  lsStoreExpires,
}) {
  return promiseResult.catch(error => {
    // refresh token and retry the call
    if (error.status === 401) {
      // No refresh function given throw the original error
      if (typeof refreshTokenCall !== 'function') {
        // Log out ma men
        store.dispatch(logout())
        return Promise.reject(error)
      }
      // Try refresing token...
      const refreshToken = getRefreshToken()
      // At this time access token is bad
      const badAccessToken = getAccessToken()

      return refreshTokenCall(refreshToken).then(
        refresh => {
          // Re-try da call
          return apiFn(refresh.access_token)(...args).then(
            result => {
              // Notify store da refresh!
              if (getAccessToken() === badAccessToken) {
                store.dispatch(
                  tokenRefreshed({
                    accessToken: refresh.access_token,
                    refreshToken: refresh.refresh_token,
                    expires: refresh.expires,
                  })
                )
                // Write lo local storage!
                lsStoreAccessToken(refresh.access_token)
                lsStoreRefreshToken(refresh.refresh_token)
                if (refresh.expires) {
                  lsStoreExpires(refresh.expires)
                }
              }
              // YEAH Go result!
              return result
            },
            error => {
              // The api fail again ....
              if (error.status === 401) {
                store.dispatch(logout())
              } else if (error.status === 403) {
                store.dispatch(logout({ fromPermission: true }))
              }
              return Promise.reject(error)
            }
          )
        },
        () => {
          // Logout ma men
          store.dispatch(logout())
          // Fuck off if the refresh call fails throw the original 401 error
          return Promise.reject(error)
        }
      )
    } else {
      if (error.status === 403) {
        store.dispatch(logout({ fromPermission: true }))
      }
      // Normal error handling
      return Promise.reject(error)
    }
  })
}

export default function makeAuthApiCallFromStore(
  {
    // Do the me call using after login to get
    meCall,
    loginCall,
    refreshTokenCall,
    storageBackend,
    reduxMountPoint,
    localStorageNamespace,
    makeErrorFromException,
  },
  store
) {
  const selectAuth = state => state[reduxMountPoint]
  const getRefreshToken = state => selectAuth(store.getState()).refreshToken
  const getAccessToken = state => selectAuth(store.getState()).accessToken

  function lsStoreAccessToken(token) {
    const jsonToken = token === undefined ? 'null' : JSON.stringify(token)
    try {
      localStorage.setItem(`${localStorageNamespace}:accessToken`, jsonToken)
    } catch (e) {
      console.log('Failed to write to local storage', e)
    }
  }
  function lsStoreRefreshToken(token) {
    const jsonToken = token === undefined ? 'null' : JSON.stringify(token)
    try {
      localStorage.setItem(`${localStorageNamespace}:refreshToken`, jsonToken)
    } catch (e) {
      console.log('Failed to write to local storage', e)
    }
  }

  function lsStoreExpires(expires) {
    // Store along seconds timestamp...
    const timestamp = parseInt(new Date().getTime() / 1000, 10)
    try {
      localStorage.setItem(
        'setItem',
        `${localStorageNamespace}:expires`,
        `${expires},${timestamp}`
      )
    } catch (e) {
      console.log('Failed to write to local storage', e)
    }
  }

  return function authApiCall(apiFn, ...args) {
    const accessToken = getAccessToken()
    const apiResult = apiFn(accessToken)(...args)

    return apiResult
    console.log(apiResult)

    let proxyFn

    if (isObservable(apiResult)) {
      proxyFn = proxyObservable
    } else {
      proxyFn = proxyPromise
    }

    return proxyFn(apiResult, store, apiFn, args, {
      // Auth selectors
      getAccessToken,
      getRefreshToken,
      // Refresh API call
      refreshTokenCall,
      // Storage methods
      lsStoreAccessToken,
      lsStoreRefreshToken,
      lsStoreExpires,
    })
  }
}
