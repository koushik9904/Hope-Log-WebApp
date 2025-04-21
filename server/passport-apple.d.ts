declare module 'passport-apple' {
  import { Strategy as PassportStrategy } from 'passport';
  
  export interface AppleStrategyOptions {
    clientID: string;
    teamID: string;
    keyID: string;
    privateKeyLocation: string;
    callbackURL: string;
    scope?: string[];
    passReqToCallback?: boolean;
  }
  
  export interface AppleProfile {
    id: string;
    name?: {
      firstName?: string;
      lastName?: string;
    };
    emails?: { value: string; type?: string }[];
    photos?: { value: string }[];
    _json: any;
    _raw: string;
  }
  
  export type VerifyCallback = (
    accessToken: string,
    refreshToken: string,
    profile: AppleProfile, 
    done: (error: any, user?: any, info?: any) => void
  ) => void;
  
  export class Strategy extends PassportStrategy {
    constructor(options: AppleStrategyOptions, verify: VerifyCallback);
    name: string;
    authenticate(req: any, options?: any): void;
  }
}