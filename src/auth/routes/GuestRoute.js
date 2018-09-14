import React from 'react'
import { connect } from 'react-redux'
import { Route, Redirect } from 'react-router-dom'

/**
 * Redirect to home when user logged in
 *
 */
const GuestRoute = ({
  component,
  spinner = null,
  auth,
  redirectTo = '/',
  redirectToReferrer = true,
  ...rest
}) => (
  <Route
    {...rest}
    render={props => {
      if (auth.user) {

        // Redirect to referrer location
        const { location } = props
        if (redirectToReferrer && location.state && location.state.referrer) {
          return (
            <Redirect
              to={location.state.referrer}
            />
          )
        }

        return (
          <Redirect
            to={{
              pathname: redirectTo,
            }}
          />
        )
      }

      if (auth.authenticatingWithToken) {
        return spinner ?  React.createElement(spinner) : null
      }

      return React.createElement(component, props)
    }}
  />
)

export default connect(({ auth }) => ({ auth }))(GuestRoute)
