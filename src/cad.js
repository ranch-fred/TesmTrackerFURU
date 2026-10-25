export const cadExtensions = ['step', 'stp', 'sldprt', 'sldasm', 'slddrw', 'zip'];
export const maxCadBytes = 50 * 1024 * 1024;
export function cadExtension(filename) {
  return String(filename || '')
    .split('.')
    .pop()
    .toLowerCase();
}
export function validateCadFile(file) {
  if (!file || !cadExtensions.includes(cadExtension(file.name)))
    throw Error(
      'Choose a STEP, SolidWorks, or ZIP file (.step, .stp, .sldprt, .sldasm, .slddrw, .zip).',
    );
  if (!file.size || file.size > maxCadBytes)
    throw Error('CAD files must be between 1 byte and 50 MB.');
  return cadExtension(file.name);
}
