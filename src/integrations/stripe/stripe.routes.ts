import Stripe from 'stripe';
import type { Context as HonoContext } from 'hono';
import triggerCore from '../../core/trigger.core.js';
import CONNECTIONS from '../../data/connections.json' with { type: 'json' };

const RESOURCES_AVAILABLE = [
    'refund',
    'customer.subscription',
    'checkout.session',
    'payment_intent',
    'customer',
    'invoice',
    'charge',
    'product',
    'price',
];

const stripeConnections = Object.values(CONNECTIONS as { [key: string]: any }).filter(c => c.integration === 'stripe');
for (const connection of stripeConnections) {
    const isWebhookEnabled = process.env[connection.config?.webhookEnabled?.__envVariableKey] === 'TRUE';
    if (!isWebhookEnabled) continue;
    const path = process.env[connection.config?.webhookPath?.__envVariableKey];
    if (!path) continue;
    const secretApiKey = process.env[connection.config?.secretApiKey?.__envVariableKey];
    if (!secretApiKey) continue;
    const webhookSecretKey = process.env[connection.config?.webhookSecretKey?.__envVariableKey];
    if (!webhookSecretKey) continue;

    global.public.post(path, async (c: HonoContext) => {
        const signature = c.req.header('stripe-signature');
        if (!signature) return c.json({}, 400);

        let event: Stripe.Event;
        try {
            const stripe = new Stripe(secretApiKey);
            event = stripe.webhooks.constructEvent(await c.req.text(), signature, webhookSecretKey);
        } catch (err) {
            return c.json({}, 400);
        }

        const resource = event.type.slice(0, event.type.lastIndexOf('.'));
        if (!RESOURCES_AVAILABLE.includes(resource)) return c.json({ ignored: true }, 200);

        const action = event.type.slice(event.type.lastIndexOf('.') + 1);
        await triggerCore.execute(
            `stripe/${resource}`,
            { ...event.data.object, action },
            {
                socketId: c.req.header('ww-socket-id'),
                editorUserId: c.req.header('ww-editor-user-id'),
                honoContext: c,
            }
        );

        return c.json({}, 200);
    });
}
