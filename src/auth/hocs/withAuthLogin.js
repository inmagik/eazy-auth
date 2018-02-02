import { PureComponent, createElement } from 'react'
import { connect } from 'react-redux'
import hoistStatics from 'hoist-non-react-statics'
import {
  isLoginLoading,
  getLoginError,
} from '../selectors'
import {
  clearLoginError,
  login,
} from '../actions'

export default function withAuthLogin(c = {}) {
  const config = {
    credentials: ['email', 'password'],
    ...c,
  }
  const defaultCredentials = config.credentials.reduce((r, c) => ({
    ...r,
    [c]: '',
  }), {})

  return function wrapWithLogin(WrappedComponent) {
    class BaseLogin extends PureComponent {
      state = {
        credentials: defaultCredentials,
      }

      componentWillUnmount() {
        this.props.clearLoginError()
      }

      makeOnCredentialChange = field => e => {
        const value = e.target.value
        this.setState(prevState => ({
          credentials: { ...prevState.credentials, [field]: value }
        }))
      }

      handleLoginSubmit = e => {
        e.preventDefault()
        const { credentials } = this.state
        const isValid = Object.keys(credentials)
          .every(c => credentials[c].trim() !== '')

        if (isValid) {
          this.props.login(credentials)
        }
      }

      makeCredentialsProp = () => {
        return config.credentials.reduce((r, c) => ({
          ...r,
          [c]: {
            value: this.state.credentials[c],
            onChange: this.makeOnCredentialChange(c),
          }
        }), {})
      }

      render() {
        return createElement(WrappedComponent, {
          ...this.props,
          credentials: this.makeCredentialsProp(),
          handleSubmit: this.handleLoginSubmit,
        })
      }
    }

    const mapStateToProps = state => ({
      error: getLoginError(state),
      loading: isLoginLoading(state),
    })
    const Login = connect(mapStateToProps, {
      clearLoginError,
      login,
    })(BaseLogin)

    return hoistStatics(Login, WrappedComponent)
  }
}
