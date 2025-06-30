import OAuth2Strategy, { StrategyOptions, VerifyFunction } from 'passport-oauth2';
type CanvasStrategyOptions = StrategyOptions & {
    host: string;
    userProfileURL?: string;
};
export default class Strategy extends OAuth2Strategy {
    options: CanvasStrategyOptions;
    _userProfileURL: string;
    constructor(options: CanvasStrategyOptions, verify: VerifyFunction);
    userProfile(accessToken: string, done: (error: any, profile?: any) => void): void;
    parse(json: string | Record<string, unknown>): Record<string, unknown>;
}
export {};
