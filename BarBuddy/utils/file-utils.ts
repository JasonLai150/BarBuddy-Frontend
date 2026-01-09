/**
 * Utility functions for file handling
 */

/**
 * Trim a filename to a maximum length while preserving the file extension
 * If the filename exceeds maxLength, it will be truncated with "..." before the extension
 *
 * Example: "very_long_filename_that_exceeds_maximum_length.mp4" -> "very_long_filename_that_exce....mp4"
 */
export function trimFilename(filename: string, maxLength: number = 50): string {
  if (filename.length <= maxLength) {
    return filename;
  }

  // Get the file extension
  const lastDotIndex = filename.lastIndexOf('.');
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  const nameWithoutExtension = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;

  // Calculate how much space we have for the name part
  // Reserve space for "..." and the extension
  const ellipsis = '...';
  const availableLength = maxLength - extension.length - ellipsis.length;

  if (availableLength <= 0) {
    // If extension itself is too long, just return the original filename
    return filename;
  }

  // Trim the name and add ellipsis
  const trimmedName = nameWithoutExtension.substring(0, availableLength);
  return trimmedName + ellipsis + extension;
}
