import { getSignedCookie, setSignedCookie, getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import wewebService from '../services/weweb.service.js';

export const ensureWWAuth = async (c, next) => {
    if (process.env.WEWEB_ENV === 'local' && process.env.NODE_ENV === 'production') return next();
    const secret = process.env.WEWEB_PROJECT_SECRET;

    // Used for weweb-ai or weweb-back
    if (c.req.header('ww-project-secret') === secret) {
        return next();
    }

    const lambdaCookieName = `ww-${process.env.WEWEB_PROJECT_ID}-access-token`;
    const userCookieName = 'ww-access-token';

    const lambdaCookie = await getSignedCookie(c, secret, lambdaCookieName);

    if (lambdaCookie && lambdaCookie !== false) {
        return next();
    }

    const userCookie = getCookie(c, userCookieName);

    if (!userCookie) {
        throw new HTTPException(401, { message: 'Unauthorized', cause: 'No user cookie found' });
    }

    try {
        await wewebService.ensureDesignAccess(process.env.WEWEB_PROJECT_ID, userCookie);
    } catch (error) {
        console.log(error);
        console.log(process.env.WEWEB_PROJECT_ID);
        throw new HTTPException(403, { message: 'Forbidden', cause: 'No design access' });
    }

    await setSignedCookie(c, lambdaCookieName, 'trust', secret, {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'None',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return next();
};
