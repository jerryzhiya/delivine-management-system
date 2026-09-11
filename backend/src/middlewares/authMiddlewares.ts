import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

//Extending the request type so TypeScript knows 'req.user' exist
export interface AuthRequest extends Request {
    user?: { id: string; role: string}
}

const getTokenFromHeader = (req: AuthRequest) => {
    const authHeader = req.headers.authorization;

    if (typeof authHeader !== 'string') {
        return undefined;
    }

    const trimmedHeader = authHeader.trim();
    if (!trimmedHeader) {
        return undefined;
    }

    if (/^bearer\s+/i.test(trimmedHeader)) {
        return trimmedHeader.replace(/^bearer\s+/i, '').trim();
    }

    return trimmedHeader;
};

//middleware to verify if the user is logged in
export const protectRoute = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = getTokenFromHeader(req);

    if (!token) {
        return res.status(401).json({ error: 'No authorization to access this route, no token provided' });
    }

    //Verify token
    const secretCandidates = [
        process.env.JWT_SECRET,
        process.env.NODE_ENV === 'production' ? undefined : 'development-secret',
    ].filter((value): value is string => Boolean(value));
    let decoded: { id: string; role: string } | undefined;
    let lastError: unknown;

    for (const secret of secretCandidates) {
        try {
            decoded = jwt.verify(token, secret) as { id: string; role: string };
            break;
        } catch (error) {
            lastError = error;
        }
    }

    if (!decoded) {
        const message = lastError instanceof Error && 'name' in lastError && lastError.name === 'TokenExpiredError'
            ? 'Token has expired. Please login again to get a new token.'
            : 'Not authorize, token failed or expires';

        console.error('Token verification failed:', lastError);
        return res.status(401).json({ error: message });
    }

    //Attach user info to the req object
    req.user = decoded;
    next();
};

//Middleware to restict access base on role (e.g Only Admins)
export const authorizedRoles = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `user role '${req.user?.role}' is not authorize to access this route`
            });
        }
        next();
    };
};

    