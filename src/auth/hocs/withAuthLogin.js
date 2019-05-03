import { PureComponent, createElement } from 'react'
import { connect } from 'react-redux'
import hoistStatics from 'hoist-non-react-statics'
import { isLoginLoading, getLoginError } from '../selectors'
import { clearLoginError, login } from '../actions'

export default function withAuthLogin(c = {}) {
  const config = {
    credentials: ['email', 'password'],
    native: false,
    shouldClearErrorOnChange: true,
    ...c,
  }
  const defaultCredentials = config.credentials.reduce(
    (r, c) => ({
      ...r,
      [c]: '',
    }),
    {}
  )

  return function wrapWithLogin(WrappedComponent) {
    class BaseLogin extends PureComponent {
      state = {
        credentials: defaultCredentials,
      }

      componentWillUnmount() {
        this.props.clearLoginError()
      }

      makeOnCredentialChange = field => e => {
        let value = e
        if (
          e &&
          typeof window !== 'undefined' &&
          typeof window.Element !== 'undefined' &&
          e.target instanceof window.Element
        ) {
          value = e.target.value
        }
        if (this.props.error && config.shouldClearErrorOnChange) {
          this.props.clearLoginError()
        }
        this.setState(prevState => ({
          credentials: { ...prevState.credentials, [field]: value },
        }))
      }

      handleLoginSubmit = e => {
        if (
          e &&
          typeof e === 'object' &&
          typeof e.preventDefault === 'function'
        ) {
          e.preventDefault()
        }
        const { credentials } = this.state
        const isValid = Object.keys(credentials).every(
          c => credentials[c].trim() !== ''
        )

        if (isValid) {
          this.props.login(credentials)
        }
      }

      makeCredentialsProp = () => {
        return config.credentials.reduce((r, c) => {
          const onChangeKey = config.native ? 'onChangeText' : 'onChange'
          return {
            ...r,
            [c]: {
              value: this.state.credentials[c],
              [onChangeKey]: this.makeOnCredentialChange(c),
            },
          }
        }, {})
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
    const Login = connect(
      mapStateToProps,
      {
        clearLoginError,
        login,
      }
    )(BaseLogin)

    return hoistStatics(Login, WrappedComponent)
  }
}
