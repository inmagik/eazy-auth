import { NS } from '../../config'

export const RECOVER_PASSWORD_UNLOAD = `${NS}RECOVER_PASSWORD_UNLOAD`
export const RECOVER_PASSWORD = `${NS}RECOVER_PASSWORD`
export const RECOVER_PASSWORD_LOADING = `${NS}RECOVER_PASSWORD_LOADING`
export const RECOVER_PASSWORD_SUCCESS = `${NS}RECOVER_PASSWORD_SUCCESS`
export const RECOVER_PASSWORD_FAILURE = `${NS}RECOVER_PASSWORD_FAILURE`

export const recoverPassword = (...params) => ({
  type: RECOVER_PASSWORD,
  payload: {
    params,
  },
})

export const unloadPasswordRecover = () => ({
  type: RECOVER_PASSWORD_UNLOAD,
})
