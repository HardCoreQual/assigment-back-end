import { NotImplementedError } from './errors';
import { compare } from 'bcrypt';

// TODO(roman): implement these
// external libraries can be used
// you can even ignore them and use your own preferred method

export function passwordCoincideWithHash(password: string, hashPassword: string) {
  return new Promise(r => {
    return compare(password, hashPassword, (err, data) => {
      r(data);
    });
  });
}

export function generateToken(data: TokenData): string {
  throw new NotImplementedError('TOKEN_GENERATION_NOT_IMPLEMENTED_YET');
}

export function isValidToken(token: string): boolean {
  throw new NotImplementedError('TOKEN_VALIDATION_NOT_IMPLEMENTED_YET');
}

// NOTE(roman): assuming that `isValidToken` will be called before
export function extraDataFromToken(token: string): TokenData {
  throw new NotImplementedError('TOKEN_EXTRACTION_NOT_IMPLEMENTED_YET');
}

export interface TokenData {
  id: number;
}