export function toFileUrl(filePath) {
  if (!filePath) return null
  return `file:///${filePath.replace(/\\/g, '/')}`
}
