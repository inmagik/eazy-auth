import React from 'react'
import { connect } from 'react-redux'
import { Route, Redirect } from 'react-router-dom'

/**
 * Ensure user logged otherwise redirect them to login
 *
 */
export const AuthRoute = connect(({ auth }) => ({ auth }))(({
  component,
  spinner = null,
  redirectTo = '/login',
  rememberReferrer = true,
  redirectTest,
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
      // User authenticated
      if (auth.user) {
        // Use test function when provided
        if (typeof redirectTest === 'function') {
          const userRedirectTo = redirectTest(auth.user)
          if (userRedirectTo) {
            return (
              <Redirect
                to={{
                  pathname: userRedirectTo,
                }}
              />
            )
          }
        }
        // Render normal component
        return React.createElement(component, props)
      }
      // User not authenticated, redirect to login
      return (
        <Redirect
          to={{
            pathname: redirectTo,
            state: (rememberReferrer && !auth.logoutFromPermission)
              ? { referrer: props.location }
              : undefined,
          }}
        />
      )
    }}
  />
))

/**
 * Wait for auth loading before rendering route component
 * (needed for first time local storage auth...)
 *
 */
export const MaybeAuthRoute = connect(({ auth }) => ({ auth }))(({
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
))

/**
 * Redirect to home when user logged in
 *
 */
export const GuestRoute = connect(({ auth }) => ({ auth }))(({
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
))
