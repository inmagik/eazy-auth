// This is the near implementation to have the same effect
// of authApiCall outside redux-saga

// The api could be:
/*

const { authFlow, authCall, connectAuth } = makeAuthFlow({
  makeErrorFromException: ({ data }) => data.error,
  loginCall,
  meCall,
})

// Later...
// ... Or a better name
const auth = connectAuth(store)

// Later ...
import { auth } from '../../state/auth'

const fetchUsers = auth.wrapePromise(token => q => fetch(`/users?q=${q}`, {
  Authorization: token
}))

// Later ...
fetchUsers().then(users => this.setState({ users }))

*/

import { logout } from './actions'

// This is the
export default function({
  reduxMountPoint,
  refreshTokenCall,
}) {
  return store => {

    const selectAuth = state => state[reduxMountPoint]

    function getAccessToken() {
      return selectAuth(store.getState()).accessToken
    }
    function getRefreshToken() {
      return selectAuth(store.getState()).refreshToken
    }

    const wrapePromise = (apiFn) => {
      // GANG
      return (...args) => {
        const accessToken =  getAccessToken()
        const refreshToken =  getRefreshToken()

        // Curry access token to original fn
        // ... And pass down original arguments
        return apiFn(accessToken)(...args)
          // Catch promise error
          .catch(err => {
            console.log('Wrap auth error catched', err)
            if (
              // Is refresh token call provided?
              typeof refreshTokenCall === 'function' &&
              // Is an auth error?
              (err && err.status === 401)
            ) {
              // Try 2 refresh token
              return refreshTokenCall(refreshToken).then(
                // Token refreshed!
                refresh => {
                  // Retry the api call \w the new shit
                  // At this point the resolve and the rejection should handled
                  // by the top lovel code
                  return apiFn(refresh.access_token)(..args).then(
                    result => {
                      // TODO: Dispatch new token refreshed
                      // and save the shit in localStorage...

                      // return the result from promise
                      return result
                    },
                    // In this hell case re-check 401 and 403
                    // to stay compilant 2 original implementation
                    err => {
                      if (err) {
                        if (err.status === 401) {
                          store.dispatch(logout())
                        } else if (err.status === 403) {
                          store.dispatch(logout({ fromPermission: true }))
                        }
                      }
                      return Promise.reject(err)
                    }
                  )
                }
                // Ok at this point the token is fucked and can't be
                // refreshed...
                () => {
                  // Ingore the error of refresh...
                  // Logout!
                  store.dispatch(logout())
                  // reject the original error
                  return Promise.reject(err)
                }
              )
            } else if (err && err.status === 403) {
              // logout from permission
              store.dispatch(logout({ fromPermission: true }))
              // reject the original error
              return Promise.reject(err)
            } else {
              // Normal error handling
              return Promise.reject(err)
            }
          })
      }
    }

    return {
      // TODO: Better name...
      // Attach auth to returned promise
      wrapApiPromise,
      // wrapApiRx
    }

  }
}
