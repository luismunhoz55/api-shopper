export function isValidBase64Image(base64String: string) {
  // Regex para verificar o prefixo da string base64 para imagens
  const base64ImageRegex = /^data:image\/(png|jpg|jpeg|gif|bmp|webp);base64,/;

  // Verifica se a string começa com um prefixo válido
  if (!base64ImageRegex.test(base64String)) {
    return false;
  }

  // Remove o prefixo e verifica se os caracteres restantes são válidos em base64
  const base64Data = base64String.replace(base64ImageRegex, "");

  try {
    // Tenta decodificar a string base64
    atob(base64Data);
    return true;
  } catch (e) {
    return false;
  }
}
