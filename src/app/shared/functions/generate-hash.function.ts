import CryptoJS from 'crypto-js';

export const generateHash = <T = any>(data: Array<T> | Object) => {
  const jsonString = Array.isArray(data)
    ? JSON.stringify([...data])
    : JSON.stringify(data);

  const hashedString = CryptoJS.SHA256(jsonString).toString(CryptoJS.enc.Hex);

  return hashedString;
};
