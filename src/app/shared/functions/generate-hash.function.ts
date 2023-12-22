import CryptoJS from 'crypto-js';

export const generateHash = (data: any) => {
  // Convert the Map or array to a string representation
  const jsonString = JSON.stringify([...data]);

  // Generate the SHA-256 hash
  const hashedString = CryptoJS.SHA256(jsonString).toString(CryptoJS.enc.Hex);

  return hashedString;
};
