export function isValidBase64Image(base64String: string) {
  // Regex to verify the string prefix to base64 images
  const base64ImageRegex = /^data:image\/(png|jpg|jpeg|gif|bmp|webp);base64,/;

  // Verify if the string starts with a valid prefix
  if (!base64ImageRegex.test(base64String)) {
    return false;
  }

  // Removes the prefix and verify if the remaining characters are valid in base64
  const base64Data = base64String.replace(base64ImageRegex, "");

  try {
    // Tries to decode the base64 string
    atob(base64Data);
    return true;
  } catch (e) {
    return false;
  }
}
