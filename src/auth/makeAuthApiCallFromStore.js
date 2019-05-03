import { tokenRefreshed } from './actions'

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
    const refreshToken = getRefreshToken()

    return apiFn(accessToken)(...args).catch(error => {
      // No refresh function given throw the original error
      if (typeof refreshTokenCall !== 'function') {
        return Promise.reject(error)
      }
      // refresh token and retry the call
      if (error.status === 401) {
        // Try refresing token...
        return refreshTokenCall(refreshToken).then(
          refresh => {
            // Re-try da call
            return apiFn(refresh.access_token)(...args).then(result => {
              // Notify store da refresh!
              if (getAccessToken()) {
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
            })
          },
          () => {
            // Fuck off if the refresh call fails throw the original 401 error
            return Promise.reject(error)
          }
        )
      } else {
        // Normal error handling
        return Promise.reject(error)
      }
    })
  }
}
