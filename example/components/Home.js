import React from 'react'
import Menu from './Menu'
import { connect } from 'react-redux'
import { withAuthLogin, getAuthUser } from 'eazy-auth'

const Home = ({ user, logout }) => (
  <div>
    <Menu />
    <div className='center'>
      <h1>Hey {user.name}</h1>
      <div className="quote">{`"${user.quote}"`}</div>
      {/* <button onClick={logout}>Logout</button> */}
    </div>
  </div>
)

export default connect(state => ({
  user: getAuthUser(state),
}))(Home)
