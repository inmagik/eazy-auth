export const withExtraReducer = (baseReducer, extraReducer) => {
  if (typeof extraReducer === 'function') {
    return (prevState, action) => extraReducer(prevState, action, baseReducer)
  }
  return baseReducer
}

const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
export const isEmailValid = email => emailRegex.test(email)
