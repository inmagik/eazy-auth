import { withExtraReducer } from '../utils/index'
import {
  // Form login auth actions
  LOGIN_LOADING,
  LOGIN_FAILURE,
  LOGIN_SUCCESS,

  // Clear the login error
  CLEAR_LOGIN_ERROR,

  // Boostrapping auth / getting tokens from nowhere...
  BOOTSTRAP_AUTH_START,
  BOOTSTRAP_AUTH_END,

  // Initial auth from local storage token actions
  AUTH_WITH_TOKEN_LOADING,
  AUTH_WITH_TOKEN_FAILURE,
  AUTH_WITH_TOKEN_SUCCESS,

  // Token refresh in place,
  TOKEN_REFRESHING,

  // Token refreshed
  TOKEN_REFRESHED,

  // Update user data
  UPDATE_USER,

  // Path user data
  PATCH_USER,

  // Logout action
  LOGOUT,
} from './actions'

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  refreshing: false,
  expires: null,
  loginLoading: false,
  loginError: null,
  bootstrappingAuth: false, // TODO <--- Remove
  authBooted: false,
  authenticatingWithToken: false,
  logoutFromPermission: false,
}

const authReducer = (
  previousState = initialState,
  { type, payload, error }
) => {
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
    case BOOTSTRAP_AUTH_START:
      return {
        ...previousState,
        bootstrappingAuth: true,
      }
    case BOOTSTRAP_AUTH_END:
      return {
        ...previousState,
        authBooted: true,
        bootstrappingAuth: false,
      }
    case AUTH_WITH_TOKEN_LOADING:
      return {
        ...previousState,
        authenticatingWithToken: true,
      }
    case AUTH_WITH_TOKEN_FAILURE:
      return {
        ...previousState,
        refreshing: false,
        authenticatingWithToken: false,
      }
    case AUTH_WITH_TOKEN_SUCCESS:
      return {
        ...previousState,
        refreshing: false,
        authenticatingWithToken: false,
        expires: payload.expires,
        user: payload.user,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      }
    case TOKEN_REFRESHING:
      return {
        ...previousState,
        refreshing: true,
      }
    case TOKEN_REFRESHED:
      return {
        ...previousState,
        refreshing: false,
        expires: payload.expires,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      }
    case UPDATE_USER:
      return {
        ...previousState,
        user: payload,
      }
    case PATCH_USER:
      return {
        ...previousState,
        user: {
          ...previousState.user,
          ...payload,
        },
      }
    case LOGOUT:
      return {
        ...initialState,
        authBooted: true,
        logoutFromPermission: payload.fromPermission,
      }
    default:
      return previousState
  }
}

const makeAuthReducer = extraReducer =>
  withExtraReducer(authReducer, extraReducer)

export default makeAuthReducer
