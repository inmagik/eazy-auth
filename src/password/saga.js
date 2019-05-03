import { fork, call, put } from 'redux-saga/effects'
import { takeLatestAndCancel } from '../utils/effects'
import {
  RECOVER_PASSWORD,
  RECOVER_PASSWORD_LOADING,
  RECOVER_PASSWORD_SUCCESS,
  RECOVER_PASSWORD_FAILURE,
  RECOVER_PASSWORD_UNLOAD,
  RESET_PASSWORD_UNLOAD,
  RESET_PASSWORD_CHECK_TOKEN,
  RESET_PASSWORD_SENT,
  RESET_PASSWORD_CHECK_TOKEN_LOADING,
  RESET_PASSWORD_CHECK_TOKEN_SUCCESS,
  RESET_PASSWORD_CHECK_TOKEN_FAILURE,
  RESET_PASSWORD_SENT_LOADING,
  RESET_PASSWORD_SENT_SUCCESS,
  RESET_PASSWORD_SENT_FAILURE,
} from './actions/index'

// Make password saga
const makePassword = ({
  recoverPasswordCall,
  checkResetPasswordTokenCall,
  resetPasswordCall,
}) => {
  function* handleRecover({ payload: { params } }) {
    yield put({ type: RECOVER_PASSWORD_LOADING })
    try {
      yield call(recoverPasswordCall, ...params)
      yield put({ type: RECOVER_PASSWORD_SUCCESS })
    } catch (error) {
      yield put({ type: RECOVER_PASSWORD_FAILURE, error })
    }
  }

  function* handleCheckResetPasswordToken({ payload: { token, params } }) {
    yield put({ type: RESET_PASSWORD_CHECK_TOKEN_LOADING })
    try {
      yield call(checkResetPasswordTokenCall, token, ...params)
      yield put({
        type: RESET_PASSWORD_CHECK_TOKEN_SUCCESS,
        payload: { token },
      })
    } catch (error) {
      yield put({ type: RESET_PASSWORD_CHECK_TOKEN_FAILURE, error })
    }
  }

  function* handleResetPassword({ payload: { token, password, params } }) {
    yield put({ type: RESET_PASSWORD_SENT_LOADING })
    try {
      yield call(resetPasswordCall, token, password, ...params)
      yield put({ type: RESET_PASSWORD_SENT_SUCCESS })
    } catch (error) {
      yield put({ type: RESET_PASSWORD_SENT_FAILURE, error })
    }
  }

  function* passwordFlow() {
    yield fork(
      takeLatestAndCancel,
      RECOVER_PASSWORD,
      RECOVER_PASSWORD_UNLOAD,
      handleRecover
    )
    yield fork(
      takeLatestAndCancel,
      RESET_PASSWORD_CHECK_TOKEN,
      RESET_PASSWORD_UNLOAD,
      handleCheckResetPasswordToken
    )
    yield fork(
      takeLatestAndCancel,
      RESET_PASSWORD_SENT,
      RESET_PASSWORD_UNLOAD,
      handleResetPassword
    )
  }

  return passwordFlow
}

export default makePassword
