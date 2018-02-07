import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { NavLink } from 'react-router-dom'
import { getAuthUser, logout } from 'eazy-auth'

const Menu = ({ user, logout }) => (
  <div>
    <span className='brand'>Eazy Auth <span className='ex'>Example Site</span></span>
    {user && <b>{`(${user.username}) + ${user.age} | `}</b>}
    <NavLink to='/login'>Login</NavLink>
    {' | '}
    <NavLink to='/' exact>Home (Authenticated)</NavLink>
    {' | '}
    <NavLink to='/old' exact>Older then 27</NavLink>
    {' | '}
    <NavLink to='/about' exact>About</NavLink>
    {user && <Fragment>{' | '}<button onClick={logout}>logout</button></Fragment>}
    {' | '}
    <a href='https://github.com/inmagik/eazy-auth'>@github</a>
  </div>
)

export default connect(state => ({
  user: getAuthUser(state),
}), {
  logout,
})(Menu)
