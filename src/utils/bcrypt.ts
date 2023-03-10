import * as bcrypt from 'bcrypt';

export async function hashPassword(rawPassword: string) {
  const SALT = await bcrypt.genSalt();
  return await bcrypt.hash(rawPassword, SALT);
}

export async function comparePassword(
  rawPassword: string,
  hashPassword: string,
) {
  return await bcrypt.compare(rawPassword, hashPassword);
}
