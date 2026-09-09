import Stripe from 'stripe';

global.registerAction('stripe/customers-create', async ({ args = {} }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.customers.create({
        email: args.email,
        name: args.name,
        business_name: args.business_name,
        individual_name: args.individual_name,
        phone: args.phone,
        description: args.description,
        address: args.address,
        metadata: args.metadata,
        shipping: args.shipping,
        payment_method: args.payment_method,
        invoice_prefix: args.invoice_prefix,
        invoice_settings: args.invoice_settings,
        preferred_locales: args.preferred_locales,
        tax_exempt: args.tax_exempt,
        balance: args.balance,
        cash_balance: args.cash_balance,
        source: args.source,
        test_clock: args.test_clock,
        tax: args.tax,
        tax_id_data: args.tax_id_data,
        next_invoice_sequence: args.next_invoice_sequence,
        expand: args.expand,
    });
});

global.registerAction('stripe/customers-update', async ({ args = {} }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.customers.update(args.id, {
        email: args.email,
        name: args.name,
        business_name: args.business_name,
        individual_name: args.individual_name,
        phone: args.phone,
        description: args.description,
        address: args.address,
        metadata: args.metadata,
        shipping: args.shipping,
        default_source: args.default_source,
        invoice_prefix: args.invoice_prefix,
        invoice_settings: args.invoice_settings,
        preferred_locales: args.preferred_locales,
        tax_exempt: args.tax_exempt,
        balance: args.balance,
        cash_balance: args.cash_balance,
        source: args.source,
        tax: args.tax,
        next_invoice_sequence: args.next_invoice_sequence,
        expand: args.expand,
    });
});

global.registerAction('stripe/customers-retrieve', async ({ args = {} }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.customers.retrieve(args.id, {
        expand: args.expand,
    });
});

global.registerAction('stripe/customers-list', async ({ args = {} }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.customers.list({
        email: args.email,
        limit: args.limit,
        starting_after: args.starting_after,
        ending_before: args.ending_before,
        created: args.created,
        expand: args.expand,
        test_clock: args.test_clock,
    });
});

global.registerAction('stripe/customers-delete', async ({ args = {} }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.customers.del(args.id);
});

global.registerAction('stripe/customers-search', async ({ args = {} }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.customers.search({
        query: args.query,
        limit: args.limit,
        page: args.page,
        expand: args.expand,
    });
});
