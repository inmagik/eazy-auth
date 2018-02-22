import { withExtraReducer } from '../utils'
import {
  // Form login auth actions
  LOGIN_LOADING,
  LOGIN_FAILURE,
  LOGIN_SUCCESS,

  // Clear the login error
  CLEAR_LOGIN_ERROR,

  // Initial auth from local storage token actions
  AUTH_WITH_TOKEN_LOADING,
  AUTH_WITH_TOKEN_FAILURE,
  AUTH_WITH_TOKEN_SUCCESS,

  // Token refreshed
  TOKEN_REFRESHED,

  // Update user data
  UPDATE_USER,

  // Logout action
  LOGOUT,
} from './actions'

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  expires: null,
  loginLoading: false,
  loginError: null,
  authenticatingWithToken: false,
  logoutFromPermission: false,
}

const authReducer = (previousState = initialState, { type, payload, error }) => {
  switch (type) {
    case LOGIN_LOADING:
      return {
        ...previousState,
        loginLoading: true,
        loginError: null,
      }
    case LOGIN_FAILURE:
      return {
        ...previousState,
        loginLoading: false,
        loginError: error,
      }
    case CLEAR_LOGIN_ERROR:
      return {
        ...previousState,
        loginError: null,
      }
    case LOGIN_SUCCESS:
      return {
        ...previousState,
        loginLoading: false,
        user: payload.user,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        expires: payload.expires,
        logoutFromPermission: false,
      }
    case AUTH_WITH_TOKEN_LOADING:
      return {
        ...previousState,
        authenticatingWithToken: true,
      }
    case AUTH_WITH_TOKEN_FAILURE:
      return {
        ...previousState,
        authenticatingWithToken: false,
      }
    case AUTH_WITH_TOKEN_SUCCESS:
      return {
        ...previousState,
        authenticatingWithToken: false,
        expires: payload.expires,
        user: payload.user,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      }
    case TOKEN_REFRESHED:
      return {
        ...previousState,
        expires: payload.expires,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      }
    case UPDATE_USER:
      return {
        ...previousState,
        user: payload,
      }
    case LOGOUT:
      return {
        ...initialState,
        logoutFromPermission: payload.fromPermission,
      }
    default:
      return previousState
  }
}

const makeAuthReducer = (extraReducer) =>
  withExtraReducer(authReducer, extraReducer)

export default makeAuthReducer
