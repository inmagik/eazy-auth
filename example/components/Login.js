import React from 'react'
import Menu from './Menu'
import { Link } from 'react-router'
import { withAuthLogin } from 'eazy-auth'
import Users from './Users'

const Login = ({ handleSubmit, credentials: { username, password }, loading, error }) => (
  <div>
    <Menu />
      <div style={{ display: 'flex', marginTop: 20 }}>
        <form onSubmit={handleSubmit} className='center' style={{ flex: 1 }}>
          <h3>Login!</h3>
          <div style={{ padding: 5 }}>
            <input type='text' {...username} placeholder='username' />
          </div>
          <div style={{ padding: 5 }}>
            <input type='password' {...password}  placeholder='password' />
          </div>
          <div style={{ padding: 5 }}>
            <button disabled={loading}>{loading ? 'Sigin In...' : 'Sign IN!'}</button>
            {error && <p><b style={{ color: 'red' }}>{error}</b></p>}
          </div>
        </form>
        <div style={{ flex: 1 }}>
          <h3>USERS 👨‍💻</h3>
          <Users />
        </div>
      </div>
  </div>
)

export default withAuthLogin({
  // defaults are email and password
  credentials: ['username', 'password'],
})(Login)
