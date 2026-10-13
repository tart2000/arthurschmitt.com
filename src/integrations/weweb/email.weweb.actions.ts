import sgMail from '@sendgrid/mail';
import sgClient from '@sendgrid/client';
import { transformFileAttachments } from '../utils.ts';

global.registerAction('send-email', async ({ args }: ActionParams) => {
    try {
        sgClient.setApiKey(process.env.WEWEB_EMAIL_API_KEY);
        sgClient.setDataResidency('eu');
        sgMail.setClient(sgClient);

        if (args.attachments) {
            args.attachments = await transformFileAttachments(args.attachments, 'content');
        }
        const emailDomain = process.env.WEWEB_EMAIL_DOMAIN || 'from.weweb-apps.io';
        // Build SendGrid content array from editor fields
        let content = args.content;
        if (!content || (Array.isArray(content) && content.length === 0)) {
            if (args._contentType === 'html') {
                content = [];
                if (args._textContent) content.push({ value: args._textContent, type: 'text/plain' });
                if (args._htmlContent) content.push({ value: args._htmlContent, type: 'text/html' });
            } else if (args._textContent) {
                content = [{ value: args._textContent, type: 'text/plain' }];
            }
        }

        const [response, error] = await sgMail.send({
            to: args.to,
            from: {
                email: `${args.from.emailPrefix}@${emailDomain}`,
                name: args.from.name,
            },
            replyTo: args.replyTo?.email ? args.replyTo : undefined,
            subject: args.subject,
            content,
            attachments: args.attachments,
            categories: args.categories,
            cc: args.cc?.length ? args.cc : undefined,
            bcc: args.bcc?.length ? args.bcc : undefined,
        });

        if (error) throw error;
        return response;
    } catch (err) {
        throw err?.response?.body?.errors ?? err;
    }
});
