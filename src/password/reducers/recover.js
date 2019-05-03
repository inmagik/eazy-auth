import {
  RECOVER_PASSWORD_UNLOAD,
  RECOVER_PASSWORD_LOADING,
  RECOVER_PASSWORD_SUCCESS,
  RECOVER_PASSWORD_FAILURE,
} from '../actions/index'

const defaultState = {
  loading: false,
  // Link for recovered sent?
  recovered: false,
  error: null,
}

const recover = (prevState = defaultState, { type, payload, error }) => {
  switch (type) {
    case RECOVER_PASSWORD_UNLOAD:
      return defaultState
    case RECOVER_PASSWORD_LOADING:
      return {
        ...prevState,
        error: null,
        loading: true,
      }
    case RECOVER_PASSWORD_SUCCESS:
      return {
        ...prevState,
        loading: false,
        recovered: true,
      }
    case RECOVER_PASSWORD_FAILURE:
      return {
        ...prevState,
        error,
        loading: false,
      }
    default:
      return prevState
  }
}

export default recover
