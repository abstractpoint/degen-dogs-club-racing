import JWT from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;

if (!secret) {
    throw new Error('Missing JWT_SECRET env var');
}

interface TokenPayload {
    address: string;
    timestamp: string;
}

const createToken = (tokenPayload: TokenPayload) => JWT.sign(tokenPayload, secret);

const verifyToken = (token: string) => JWT.verify(token, secret) as TokenPayload;

export { createToken, verifyToken };
