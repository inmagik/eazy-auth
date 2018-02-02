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

export default function withAuthLogin() {
  return function wrapWithLogin(WrappedComponent) {
    class BaseLogin extends PureComponent {
      state = {
        credentials: {
          email: '',
          password: '',
        }
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

      onEmailChange = this.setCredential('email')
      onPasswordChange = this.setCredential('password')

      handleLoginSubmit = e => {
        e.preventDefault()
        const { credentials } = this.state
        if (
            credentials.email.trim() !== '' &&
            credentials.password.trim() !== ''
        ) {
          this.props.login(credentials)
        }
      }

      render() {
        return createElement(WrappedComponent, {
          ...this.props,
          ...this.state.credentials,
          onEmailChange: this.onEmailChange,
          onPasswordChange: this.onPasswordChange,
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
