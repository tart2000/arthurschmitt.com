import Stripe from 'stripe';

global.registerAction('stripe/refunds-create', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.refunds.create({
        charge: args.charge,
        payment_intent: args.payment_intent,
        amount: args.amount,
        reason: args.reason,
        metadata: args.metadata,
        instructions_email: args.instructions_email,
        refund_application_fee: args.refund_application_fee,
        reverse_transfer: args.reverse_transfer,
        origin: args.origin,
        expand: args.expand,
    });
});

global.registerAction('stripe/refunds-update', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.refunds.update(args.id, {
        metadata: args.metadata,
        expand: args.expand,
    });
});

global.registerAction('stripe/refunds-retrieve', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.refunds.retrieve(args.id, {
        expand: args.expand,
    });
});

global.registerAction('stripe/refunds-list', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.refunds.list({
        charge: args.charge,
        payment_intent: args.payment_intent,
        limit: args.limit,
        starting_after: args.starting_after,
        ending_before: args.ending_before,
        created: args.created,
        expand: args.expand,
    });
});

global.registerAction('stripe/refunds-cancel', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.refunds.cancel(args.id, {
        expand: args.expand,
    });
});
