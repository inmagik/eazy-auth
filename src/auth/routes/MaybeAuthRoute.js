import React from 'react'
import { connect } from 'react-redux'
import { Route } from 'react-router-dom'

/**
 * Wait for auth loading before rendering route component
 * (needed for first time local storage auth...)
 *
 */
const MaybeAuthRoute = ({
  component,
  spinner = null,
  auth,
  ...rest
}) => (
  <Route
    {...rest}
    render={props => {
      if (auth.authenticatingWithToken || auth.loginLoading) {
        // Show nothing or a cool loading spinner
        return spinner ? React.createElement(spinner) : null
      }
      // Always render route component
      return React.createElement(component, props)
    }}
  />
)

export default connect(({ auth }) => ({ auth }))(MaybeAuthRoute)
