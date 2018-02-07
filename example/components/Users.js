import React from 'react'
import users from '../users'

const Users = () => (
  <table>
    <thead>
      <tr>
        <th>username</th>
        <th>password</th>
        <th>age</th>
      </tr>
    </thead>
    <tbody>
      {users.map(user => (
        <tr key={user.username} className='user-login'>
          <td>{user.username}</td>
          <td>{user.password}</td>
          <td>{user.age}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

export default Users
