import { Subject, concat, of, from, throwError } from 'rxjs'
import {
  filter,
  exhaustMap,
  takeUntil,
  publish,
  map,
  catchError,
  take,
  mergeMap,
} from 'rxjs/operators'
import {
  LOGOUT,
  TOKEN_REFRESHED,
  BOOTSTRAP_AUTH_END,
  logout,
  tokenRefreshed,
  tokenRefreshing,
} from './actions'

// Emulate a 401 Unauthorized from server ....
const UNAUTHORIZED_ERROR_SHAPE = {
  status: 401,
  fromRefresh: true,
}

export default function makeAuthMiddleware({
  // Do the me call using after login to get
  meCall,
  loginCall,
  refreshTokenCall,
  storageBackend,
  reduxMountPoint,
  localStorageNamespace,
  makeErrorFromException,
}) {
  // Redux store
  let store

  // Selectors
  const selectAuth = state => state[reduxMountPoint]

  // Storage utilities
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

  // Observable of redux dispatched actions
  const actionSubject$ = new Subject()
  const action$ = actionSubject$.asObservable()

  // Redux middleware
  const authMiddleware = reduxStore => {
    // Save the instance of redux store
    store = reduxStore
    return next => action => {
      actionSubject$.next(action)
      return next(action)
    }
  }

  // Observable that emit only on LOGOUT actions
  const logout$ = action$.pipe(filter(action => action.type === LOGOUT))

  // Subject for emit refresh tasks
  const refreshEmitter$ = new Subject()

  const refresh$ = refreshEmitter$.asObservable().pipe(
    exhaustMap(refreshToken => {
      return concat(
        of(tokenRefreshing()),
        from(refreshTokenCall(refreshToken)).pipe(
          map(refreshResponse => tokenRefreshed({
            accessToken: refreshResponse.access_token,
            refreshToken: refreshResponse.refresh_token,
            expires: refreshResponse.expires,
          })),
          catchError(error => of(logout())),
          takeUntil(logout$)
        )
      )
    }),
    publish()
  )

  // Make an Observable that complete with access token
  // when TOKEN_REFRESHED action is dispatched in redux store
  // or throw a simil 401 error when logout is dispatched
  // this can be used as 'virtual' refreshToken() api
  function waitForStoreRefreshObservable() {
    return action$.pipe(
      filter(
        action => action.type === TOKEN_REFRESHED || action.type === LOGOUT
      ),
      take(1),
      mergeMap(action => {
        if (action.type === LOGOUT) {
          return throwError(UNAUTHORIZED_ERROR_SHAPE)
        }
        return of(action.payload.accessToken)
      })
    )
  }

  // Make an Observable taht complete token or 401 simil error
  function getAccessToken() {
    const { accessToken, refreshing } = selectAuth(store.getState())

    // Not authenticated, complete empty
    if (accessToken === null) {
      return of(null)
    }

    // Refresh in place wait from redux
    if (refreshing) {
      return waitForStoreRefreshObservable()
    }

    // Valid acces token in store!
    return of(accessToken)
  }

  function refreshOnUnauth(accessToken2Refresh) {
    const { refreshToken, accessToken, refreshing } = selectAuth(
      store.getState()
    )

    if (accessToken === null) {
      // An error occurred but in the meanwhile
      // logout or bad refresh was happends...
      return throwError(UNAUTHORIZED_ERROR_SHAPE)
    }

    if (refreshing) {
      return waitForStoreRefreshObservable()
    }

    if (accessToken !== accessToken2Refresh) {
      // Another cool guy has refresh ma token
      // return new tokens ...
      return of(accessToken)
    }

    // Ok this point token match the current
    // no refresh ar in place so ....
    // start refresh!
    refreshEmitter$.next(refreshToken)
    return waitForStoreRefreshObservable()
  }

  // Logout from error
  function unauthLogout(badAccessToken, error) {
    const { accessToken, refreshing } = selectAuth(store.getState())

    if (accessToken !== null && !refreshing && accessToken === badAccessToken) {
      if (typeof error === 'object' && error.status === 401) {
        store.dispatch(logout())
      } else if (typeof error === 'object' && error.status === 403) {
        store.dispatch(logout({ fromPermission: true }))
      }
    }
  }

  function onObsevableError(error, apiFn, firstAccessToken, args) {
    if (firstAccessToken !== null) {
      if (typeof refreshTokenCall !== 'function') {
        // Refresh can't be called
        // notify logout when needed give back error
        unauthLogout(firstAccessToken, error)
        return throwError(error)
      }
      if (error.status === 401) {
        // Try refresh
        return refreshOnUnauth(firstAccessToken).pipe(
          mergeMap(accessToken => {
            return from(apiFn(accessToken)(...args)).pipe(
              catchError(error => {
                unauthLogout(accessToken, error)
                return throwError(error)
              })
            )
          })
        )
      }
    }
    return throwError(error)
  }

  function callAuthApiObservable(apiFn, ...args) {
    return getAccessToken().pipe(
      mergeMap(firstAccessToken =>
        from(apiFn(firstAccessToken)(...args)).pipe(
          catchError(error =>
            onObsevableError(error, apiFn, firstAccessToken, args)
          )
        )
      )
    )
  }

  function callAuthApiPromise(apiFn, ...args) {
    return getAccessToken()
      .toPromise()
      .then(firstAccessToken => {
        return apiFn(firstAccessToken)(...args).catch(error => {
          if (firstAccessToken !== null) {
            if (typeof refreshTokenCall !== 'function') {
              // Refresh can't be called
              unauthLogout(firstAccessToken, error)
              return Promise.reject(error)
            }
            if (error.status === 401) {
              // Try refresh
              return refreshOnUnauth(firstAccessToken)
              .toPromise()
              .then(accessToken => {
                return apiFn(accessToken)(...args).catch(error => {
                  unauthLogout(firstAccessToken, error)
                  return Promise.reject(error)
                })
              })
            }
          }

          // Unauthorized
          return Promise.reject(error)
        })
      })
  }

  function run() {
    if (store === undefined) {
      throw new Error(
        `You should applyMiddleware in redux store before call run().`
      )
    }

    // GioVa 1312 illegal boy
    actionSubject$
      .pipe(
        filter(action => action.type === BOOTSTRAP_AUTH_END),
        take(1)
      )
      .subscribe(() => {
        refresh$.connect()
      })

    refresh$.subscribe(action => {
      // TODO: Maybe to other checks.... for saga problem ....
      store.dispatch(action)
      if (action.type === TOKEN_REFRESHED) {
        const { payload } = action
        // Write lo local storage!
        lsStoreAccessToken(payload.accessToken)
        lsStoreRefreshToken(payload.refreshToken)
        if (payload.expires) {
          lsStoreExpires(payload.expires)
        }
      }
    })
    return { callAuthApiPromise, callAuthApiObservable }
  }

  // Run should be called after applied middleware in redux
  authMiddleware.run = run
  return authMiddleware
}
