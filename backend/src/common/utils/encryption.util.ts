import * as crypto from 'crypto';
import { config } from 'dotenv';

const ENV = process.env.NODE_ENV;

config({ path: `.env.${ENV}` });

const algorithm = 'aes-256-gcm';
const password = process.env.ENCRYPTION_PASSWORD;

// Derive a key from the password (you can tweak salt and iterations as needed)
const key = crypto.scryptSync(password || '', 'salt', 32);

export function encrypt(text: string): string {
  // Generate a random initialization vector
  const iv = crypto.randomBytes(12); // Recommended size for GCM
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Return iv, auth tag, and encrypted data combined (e.g., in hex form)
  const data = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;

  return data;
}

export function decrypt(data: string): string {
  if (!data) {
    throw new Error('No data to decrypt');
  }
  // Split stored data into iv, auth tag, and ciphertext
  const [ivHex, authTagHex, encrypted] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
