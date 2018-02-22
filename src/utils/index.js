export const withExtraReducer = (baseReducer, extraReducer) => {
  if (typeof extraReducer === 'function') {
    return (prevState, action) => extraReducer(prevState, action, baseReducer)
  }
  return baseReducer
}
