import { combineReducers } from 'redux'
import {
  RESET_PASSWORD_UNLOAD,
  RESET_PASSWORD_CHECK_TOKEN_LOADING,
  RESET_PASSWORD_CHECK_TOKEN_SUCCESS,
  RESET_PASSWORD_CHECK_TOKEN_FAILURE,
  RESET_PASSWORD_SENT_LOADING,
  RESET_PASSWORD_SENT_SUCCESS,
  RESET_PASSWORD_SENT_FAILURE,
} from '../actions'

const defaultCheckTokenState = {
  loading: false,
  error: null,
  tokenChecked: null,
}
const checkToken = (prevState = defaultCheckTokenState, { type, payload, error }) => {
  switch (type) {
    case RESET_PASSWORD_UNLOAD:
      return defaultCheckTokenState
    case RESET_PASSWORD_CHECK_TOKEN_LOADING:
      return {
        ...prevState,
        loading: true,
      }
    case RESET_PASSWORD_CHECK_TOKEN_FAILURE:
      return {
        ...prevState,
        error,
        loading: false,
      }
    case RESET_PASSWORD_CHECK_TOKEN_SUCCESS:
      return {
        ...prevState,
        // Sure that now token is valid
        tokenChecked: payload.token,
        loading: false,
      }
    default:
      return prevState
  }
}

const defaultSentResetState = {
  loading: false,
  error: null,
  resetted: false,
}
const sentReset = (prevState = defaultSentResetState, { type, payload, error }) => {
  switch (type) {
    case RESET_PASSWORD_UNLOAD:
      return defaultSentResetState
    case RESET_PASSWORD_SENT_LOADING:
      return {
        ...prevState,
        error: null,
        loading: true,
      }
    case RESET_PASSWORD_SENT_FAILURE:
      return {
        ...prevState,
        error,
        loading: false,
      }
    case RESET_PASSWORD_SENT_SUCCESS:
      return {
        ...prevState,
        resetted: true,
        loading: false,
      }
    default:
      return prevState
  }
}

const reset = combineReducers({
  check: checkToken,
  sent: sentReset,
})

export default reset
