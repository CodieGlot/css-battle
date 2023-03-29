import type { TokenType } from '../constants';

interface ITokenPayload {
    userId: string;
    email: string;
    role: string;
    type: TokenType;
}

export default ITokenPayload;
