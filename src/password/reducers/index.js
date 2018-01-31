import { combineReducers } from 'redux'
import { withExtraReducer } from '../../utils'

import recover from './recover'
import reset from './reset'

const makePasswordReducer = (extraReducers = {}) => {
  return combineReducers({
    recover: withExtraReducer(recover, extraReducers.recover),
    reset: withExtraReducer(reset, extraReducers.reset),
  })
}

export default makePasswordReducer
