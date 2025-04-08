export function formatNumber(value: number): string {
  const absValue = Math.abs(value)
  
  // For values >= 1 million
  if (absValue >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M'
  }
  
  // For values >= 1 thousand
  if (absValue >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  }
  
  // For values with decimal places
  if (absValue % 1 !== 0) {
    return value.toFixed(2)
  }
  
  // For whole numbers
  return value.toLocaleString()
}
