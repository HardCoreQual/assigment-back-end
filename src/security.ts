import {compare} from 'bcrypt';
import jwt, {VerifyErrors} from 'jsonwebtoken';


export function passwordCoincideWithHash(password: string, hashPassword: string) {
  return new Promise(r => {
    return compare(password, hashPassword, (err, data) => {
      r(data);
    });
  });
}

export function generateToken(data: TokenData): string {
  return jwt.sign(data, <never>process.env.TOKEN_SECRET, { expiresIn: '1800s' });
}

const readToken = <T>(token: string): Promise<{ error: VerifyErrors | null, data: T | null }> => {
  return new Promise((r) => {
    jwt.verify(token, <never>process.env.TOKEN_SECRET, (err, data) => {
      r({
        data: (data as T) || null,
        error: err,
      });
    });
  });
};

export async function isValidToken(token: string): Promise<boolean> {
  const { error } = await readToken<TokenData>(token);
  return !error;
}

export async function extraDataFromToken(token: string): Promise<TokenData> {
  const { data, error } = await readToken<TokenData>(token);

  // IMPLEMENT: NOTE(roman): assuming that `isValidToken` will be called before
  if (!data || error) {
    throw new Error('Try extract data from not valid token');
  }

  return data;
}

export interface TokenData {
  id: number;
}