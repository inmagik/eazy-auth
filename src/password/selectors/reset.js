import { selectPasswordState } from './base'

const selectResetPasswordState = state => selectPasswordState(state).reset

export const isCheckingResetPasswordToken = state =>
  selectResetPasswordState(state).check.loading

export const getCheckResetPasswordTokenError = state =>
  selectResetPasswordState(state).check.error

export const getResetPasswordToken = state =>
  selectResetPasswordState(state).check.tokenChecked

export const isPasswordResetted = state =>
  selectResetPasswordState(state).sent.resetted

export const getResetPasswordError = state =>
  selectResetPasswordState(state).sent.error

export const isResettingPassword = state =>
  selectResetPasswordState(state).sent.loading
