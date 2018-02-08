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


// Login component
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

login = withAuthLogin()(Login)
```
