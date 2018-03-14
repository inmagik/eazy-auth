import { PureComponent, createElement } from 'react'
import { connect } from 'react-redux'
import { defaultMemoize } from 'reselect'
import hoistStatics from 'hoist-non-react-statics'
import {
  isCheckingResetPasswordToken,
  getCheckResetPasswordTokenError,
  getResetPasswordToken,
  getResetPasswordError,
  isResettingPassword,
  isPasswordResetted,
} from '../selectors'
import {
  unloadPasswordReset,
  checkResetPasswordToken,
  resetPassword,
} from '../actions'

export default function withPasswordReset(c = {}) {
  const config = {
    passwordValidator: password => password.trim() !== '',
    tokenFromProps: ({ token }) => token,
    shouldCheckToken: true,
    ...c,
  }

  // This avoid to re-run complex fucking regex for the same password...
  const isPasswordValid = defaultMemoize(config.passwordValidator)

  return function wrapWithReset(WrappedComponent) {
    class BaseReset extends PureComponent {
      state = {
        password: '',
        passwordRepeat: '',
      }

      getResetToken = () => config.tokenFromProps(this.props)

      componentDidMount() {
        if (config.shouldCheckToken) {
          this.props.checkResetPasswordToken(this.getResetToken())
        }
      }

      componentWillUnmount() {
        this.props.unloadPasswordReset()
      }

      onSubmitResetPassword = (e, ...args) => {
        if (e && typeof e.preventDefault === 'function') {
          e.preventDefault()
        }
        this.props.resetPassword(this.getResetToken(), this.state.password, ...args)
      }

      makeOnFieldChange = field => e => {
        let value = e
        if (e && e.target instanceof Element) {
          value = e.target.value
        }
        this.setState(prevState => ({
          [field]: value,
        }))
      }

      makeFieldsProp = () => {
        return {
          password: {
            input: {
              value: this.state.password,
              onChange: this.makeOnFieldChange('password'),
            },
            empty: this.state.password.trim() === '',
            valid: isPasswordValid(this.state.password),
          },
          passwordRepeat: {
            input: {
              value: this.state.passwordRepeat,
              onChange: this.makeOnFieldChange('passwordRepeat'),
            },
            empty: this.state.passwordRepeat.trim() === '',
            equal: this.state.password === this.state.passwordRepeat,
          },
        }
      }

      // Is form valid?
      isValid = () => {
        return (
          this.state.password.trim() !== '' &&
          this.state.passwordRepeat.trim() !== '' &&
          isPasswordValid(this.state.password) &&
          this.state.password === this.state.passwordRepeat
        )
      }

      render() {
        return createElement(WrappedComponent, {
          ...this.props,
          handleSubmit: this.onSubmitResetPassword,
          fields: this.makeFieldsProp(),
          isValid: this.isValid(),
          resetToken: this.getResetToken(),
        })
      }
    }

    const mapStateToProps = state => ({
      isCheckingResetToken: isCheckingResetPasswordToken(state),
      checkTokenError: getCheckResetPasswordTokenError(state),
      resetPasswordError: getResetPasswordError(state),
      validResetToken: getResetPasswordToken(state),
      passwordResetted: isPasswordResetted(state),
      isResettingPassword: isResettingPassword(state),
    })
    const Reset = connect(mapStateToProps, {
      checkResetPasswordToken,
      unloadPasswordReset,
      resetPassword,
    })(BaseReset)

    return hoistStatics(Reset, WrappedComponent)
  }
}
