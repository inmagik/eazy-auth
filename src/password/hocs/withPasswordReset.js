import { PureComponent, createElement } from 'react'
import { connect } from 'react-redux'
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

export default function withPasswordReset(tokenFromProps) {
  return function wrapWithReset(WrappedComponent) {
    class BaseReset extends PureComponent {
      state = {
        password: '',
        passwordRepeat: '',
      }

      getResetToken = () => tokenFromProps(this.props)

      componentDidMount() {
        this.props.checkResetPasswordToken(this.getResetToken())
      }

      componentWillUnmount() {
        this.props.unloadPasswordReset()
      }

      onPasswordChange = e => {
        this.setState({
          password: e.target.value,
        })
      }

      onPasswordRepeatChange = e => {
        this.setState({
          passwordRepeat: e.target.value,
        })
      }

      onSubmitResetPassword = e => {
        e.preventDefault()
        this.props.resetPassword(this.state.password)
      }

      render() {
        return createElement(WrappedComponent, {
          ...this.props,
          onPasswordChange: this.onPasswordChange,
          onPasswordRepeatChange: this.onPasswordRepeatChange,
          onSubmitResetPassword: this.onSubmitResetPassword,
          password: this.state.password,
          passwordRepeat: this.state.passwordRepeat,
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
