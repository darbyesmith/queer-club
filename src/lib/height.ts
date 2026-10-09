export function formatHeight(totalInches: number | null | undefined): string {
  if (!totalInches) return ''
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  return `${feet}'${inches}"`
}

// Options for a height <select>, from 4'0" to 7'0".
export const HEIGHT_OPTIONS = Array.from({ length: 84 - 48 + 1 }, (_, i) => {
  const totalInches = 48 + i
  return { value: totalInches, label: formatHeight(totalInches) }
})
