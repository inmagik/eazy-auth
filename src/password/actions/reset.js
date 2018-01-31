import { NS } from '../../config'

export const RESET_PASSWORD_UNLOAD = `${NS}RESET_PASSWORD_UNLOAD`
export const unloadPasswordReset = () => ({
  type: RESET_PASSWORD_UNLOAD,
})

export const RESET_PASSWORD_CHECK_TOKEN = `${NS}RESET_PASSWORD_CHECK_TOKEN`
export const RESET_PASSWORD_CHECK_TOKEN_LOADING = `${NS}RESET_PASSWORD_CHECK_TOKEN_LOADING`
export const RESET_PASSWORD_CHECK_TOKEN_SUCCESS = `${NS}RESET_PASSWORD_CHECK_TOKEN_SUCCESS`
export const RESET_PASSWORD_CHECK_TOKEN_FAILURE = `${NS}RESET_PASSWORD_CHECK_TOKEN_FAILURE`

export const checkResetPasswordToken = (token, ...params) => ({
  type: RESET_PASSWORD_CHECK_TOKEN,
  payload: {
    token,
    params,
  },
})

export const RESET_PASSWORD_SENT = `${NS}RESET_PASSWORD_SENT`
export const RESET_PASSWORD_SENT_LOADING = `${NS}RESET_PASSWORD_SENT_LOADING`
export const RESET_PASSWORD_SENT_SUCCESS = `${NS}RESET_PASSWORD_SENT_SUCCESS`
export const RESET_PASSWORD_SENT_FAILURE = `${NS}RESET_PASSWORD_SENT_FAILURE`

export const resetPassword = (password, ...params) => ({
  type: RESET_PASSWORD_SENT,
  payload: {
    password,
    params,
  },
})
