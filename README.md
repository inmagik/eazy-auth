# eazy-auth

Easy auth stuff \w redux

Battery included but extractable package to automate auth boring stuff.

The stack is `redux`, `react` for UI, `redux-saga` for side effects and `react-router-dom` for routing.


[Example App](https://inmagik.github.io/eazy-auth)

## Install
```
yarn add eazy-auth
```
or
```
npm install eazy-auth --save
```

## Cheat sheet
```js

// Redux
// Make the auth reducer using auth as reducer key
import { makeAuthReducer } from 'eazy-auth'
const rootReducer = combineReducers({
  auth: makeAuthReducer(),
})

// Redux saga
// Make the auth flow (managed using redux-saga)
// you get authFlow a saga to fork to bootstrap auth
// authCall a version of redux-saga call function but with auth token curried
import { makeAuthFlow } from 'eazy-auth'
const { authFlow, authCall } = makeAuthFlow({
  loginCall: credentials => /* promise that resolve ({ access_token, refresh_token )}  */,
  refreshTokenCall: refreshToken => /* promise that resolve refreshed ({ access_token, refresh_token )} */,
  meCall: token => /* promise that resolve object with user data  */,
})

function *mainSaga() {
  // Bootstrap the auth
  // when user logged in for the first time eazy-auth save the tokens in local storage
  // when user return to app eazy-auth take tokens from local storage and perform a me call
  // (try to refresh tokens if function is provided) if all is ok user data are stored in redux
  // and update tokens in local storage if needed otherwise local storage is cleared
  yield fork(authFlow)

  // authCall is a enhance version of redux-saga call https://redux-saga.js.org/docs/api/#callfn-args
  // but it call the function with the access token curried so you can do authenticated api call
  // plus if the api reject and the exception contains a status key with 401 eazy-auht try to refresh token and
  // retrying the call if fail again or no refresh function is provided logout and clear state and local storage
  try {
    const data = yield call(token => Api.fetchUser(token), action.payload.id)
    yield put({type: "FETCH_SUCCEEDED", data})
  } catch (error) {
    yield put({type: "FETCH_FAILED", error})
  }

  // \\\TIP///
  // for call api i personally use superagent https://github.com/visionmedia/superagent
  // for automate the injection of token you can use a helper like that or do a similar stuff \w other fetching libraries
  const withToken = (token, baseRequest) =>
    (token ? baseRequest.set('Authorization', `Bearer ${token}`) : baseRequest)

  const fetchUser = token => id =>
    withToken(token, request.get(`/api/users/${id}`))
}

// React
// What you get?

// Action creators
import {
  // Login using credentials
  // login({ username, password })
  login,
  // Logout and clear local storage
  // logout()
  logout,
  // Clear login erro in state
  clearLoginError,
  // A helper to update user in state
  // updateUser({ username, age, ... })
  updateUser,
} from 'eazy-auth'

// Selectors
import {
  isLoginLoading,
  getLoginError,
  getAuthUser,
  getAuthAccessToken,
  getAuthRefreshToken,
} from 'eazy-auth'

// ... And if you want o covenient high order component for login
import { withAuthLogin } from 'eazy-auth'

let Login = ({ handleSubmit, credentials: { email, password }, error, loading }) => (
  <form onSubmit={handleSubmit}>
    <div>
      <input type='email' {...email} />
    </div>
    <div>
      <input type='password' {...password} />
    </div>
    <div>
      <input type='submit' />
    </div>
    {loading && <div>Login...</div>}
    {error && <div>Bad credentials</div>}
  </form>
)

login = withAuthLogin({
  // Defaults
  credentials: ['email', 'password'],
  shouldclearErrorOnChange: true,
})(Login)


// React router v4
import { AuthRoute } from 'eazy-auth'

const App = () => (
  <Provider store={store}>
    <Router>
      <Switch>
        {/*  Redirect user to another route if not authenticated */}
        <AuthRoute
          path='/profile'
          exact
          component={Old}
          {/* Path to redirect */}
          redirectTo={'/login'}
          {/* Spinner to use while loading */}
          spinner={null},
          {/* Remeber referrer when redirect guests? */}
          rememberReferrer={true}
          {/* Additional function to check permission on user and redirect */}
          redirectTest={user => user.age > 27 ? false : '/'}
        />
        {/*  Redirect user to another route if authenticated */}
        <GuestRoute
          path='/login'
          exact
          component={Login}
          spinner={null}
          redirectTo={'/'}
          {/* Redirect to referrer if user logged in? */}
          redirectToReferrer={true}
        />
        {/*
          Simply if user has a token in local storage and not yet me has been
          performed wait until me complete before mounting component
          optionally show a spinner if you want
        */}
        <MaybeAuthRoute
          path='/home'
          exact
          component={Home}
          spinner={null},
        />
      </Switch>
    </Router>
  </Provider>
)
```
## authMiddleware

`eazy-auth` was originally built with `redux-saga` in mind but in certain situation you need to hook the auth "side effects" outside the `redux-saga` environment for example directly in react components.

This is why  the `authMiddleware` was created.

Create auth middleware:

```js
const { authFlow, authCall, makeAuthMiddleware } = makeAuthFlow({
  /* Normal configuration, see above */
})
const authMiddleware = makeAuthMiddleware()
const sagaMiddleware = createSagaMiddleware()

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
const store = createStore(
  rootReducer,
  undefined,
  composeEnhancers(
    applyMiddleware(sagaMiddleware, authMiddleware),
  )
)
// IMPORTATION run authMiddleware before the sagaMiddleware 
export const { callAuthApiObservable, callAuthApiPromise } = authMiddleware.run()
sagaMiddleware.run(mainSaga)

export default store
```

### callAuthApiPromise(apiCall, ...args)

`apiCall: (accessToken)(...args) => Promise`

Curry the `accessToken` if any, logout on rejection matches `{ status: 401|403 }` and try refresh if a refresh call is given, if refresh is good re-try the `apiCall` otherwis rejects.

Return a Promise.

### callAuthApiObservable(apiCall, ...args)

`apiCall: (accessToken)(...args) => Promise|Observable`

Same as above but implement with observables.

Return a Observable.

