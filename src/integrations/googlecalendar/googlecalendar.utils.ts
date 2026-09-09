import { GoogleAuth } from 'google-auth-library';
import { calendar } from '@googleapis/calendar';

function getCredentialsObject(clientEmail: string, privateKey: string) {
    return {
        type: 'service_account',
        client_email: clientEmail,
        private_key: privateKey,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        universe_domain: 'googleapis.com',
    };
}

export function getCalendarClient(connection: ConnectionConfig) {
    const googleAuth = new GoogleAuth({
        credentials: getCredentialsObject(connection?.clientEmail, connection?.privateKey),
        scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    return calendar({ version: 'v3', auth: googleAuth });
}
