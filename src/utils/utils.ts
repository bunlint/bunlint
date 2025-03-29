export const getCurrentTimestamp = (): string => {
  // eslint-disable-next-line custom-rules/no-class-inheritance
  return new Date().toISOString()
}