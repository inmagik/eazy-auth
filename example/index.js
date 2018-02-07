import ReactDOM from 'react-dom'
import React from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store'
import { GuestRoute, AuthRoute } from 'eazy-auth'
import './example.css'
import Home from './components/Home'
import Login from './components/Login'
import About from './components/About'
import Old from './components/Old'

const App = () => (
  <Provider store={store}>
    <Router>
      <Switch>
        <GuestRoute path='/login' exact component={Login} />
        <AuthRoute path='/' exact component={Home} />
        <AuthRoute
          path='/old'
          exact
          component={Old}
          redirectTest={user => user.age > 27 ? false : '/'}
        />
        <Route path='/about' exact component={About} />
      </Switch>
    </Router>
  </Provider>
)

ReactDOM.render(<App />, document.getElementById('root'))
