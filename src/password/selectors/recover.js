import { selectPasswordState } from './base'

const selectRecoverPasswordState = state =>
  selectPasswordState(state).recover

export const getPasswordRecoverEmail = state =>
  selectRecoverPasswordState(state).email

export const isPasswordRecoverLoading = state =>
  selectRecoverPasswordState(state).loading

export const getPasswordRecoverError = state =>
  selectRecoverPasswordState(state).error

export const isPasswordRecovered = state =>
  selectRecoverPasswordState(state).recovered
