import Stripe from 'stripe';

global.registerAction('stripe/invoices-delete', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.invoices.del(args.id);
});

global.registerAction('stripe/invoices-create', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.invoices.create({
        customer: args.customer,
        auto_advance: args.auto_advance,
        collection_method: args.collection_method,
        description: args.description,
        days_until_due: args.days_until_due,
        due_date: args.due_date,
        metadata: args.metadata,
        subscription: args.subscription,
        account_tax_ids: args.account_tax_ids,
        application_fee_amount: args.application_fee_amount,
        currency: args.currency,
        custom_fields: args.custom_fields,
        default_payment_method: args.default_payment_method,
        default_source: args.default_source,
        default_tax_rates: args.default_tax_rates,
        discounts: args.discounts,
        footer: args.footer,
        from_invoice: args.from_invoice,
        pending_invoice_items_behavior: args.pending_invoice_items_behavior,
        rendering: args.rendering,
        statement_descriptor: args.statement_descriptor,
        transfer_data: args.transfer_data,
        automatically_finalizes_at: args.automatically_finalizes_at,
        automatic_tax: args.automatic_tax,
        effective_at: args.effective_at,
        issuer: args.issuer,
        number: args.number,
        on_behalf_of: args.on_behalf_of,
        payment_settings: args.payment_settings,
        shipping_cost: args.shipping_cost,
        shipping_details: args.shipping_details,
        customer_account: args.customer_account,
        expand: args.expand,
    });
});

global.registerAction('stripe/invoices-preview-create', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.invoices.createPreview({
        customer: args.customer,
        subscription: args.subscription,
        subscription_details: args.subscription_details,
        automatic_tax: args.automatic_tax,
        currency: args.currency,
        discounts: args.discounts,
        invoice_items: args.invoice_items,
        issuer: args.issuer,
        on_behalf_of: args.on_behalf_of,
        schedule: args.schedule,
        schedule_details: args.schedule_details,
        customer_details: args.customer_details,
        expand: args.expand,
    });
});

global.registerAction('stripe/invoices-update', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.invoices.update(args.id, {
        auto_advance: args.auto_advance,
        collection_method: args.collection_method,
        description: args.description,
        days_until_due: args.days_until_due,
        due_date: args.due_date,
        metadata: args.metadata,
        account_tax_ids: args.account_tax_ids,
        application_fee_amount: args.application_fee_amount,
        custom_fields: args.custom_fields,
        default_payment_method: args.default_payment_method,
        default_source: args.default_source,
        default_tax_rates: args.default_tax_rates,
        discounts: args.discounts,
        footer: args.footer,
        on_behalf_of: args.on_behalf_of,
        payment_settings: args.payment_settings,
        rendering: args.rendering,
        statement_descriptor: args.statement_descriptor,
        transfer_data: args.transfer_data,
        automatically_finalizes_at: args.automatically_finalizes_at,
        automatic_tax: args.automatic_tax,
        effective_at: args.effective_at,
        issuer: args.issuer,
        number: args.number,
        shipping_cost: args.shipping_cost,
        shipping_details: args.shipping_details,
        expand: args.expand,
    });
});

global.registerAction('stripe/invoices-retrieve', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.invoices.retrieve(args.id, {
        expand: args.expand,
    });
});

global.registerAction('stripe/invoices-list', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.invoices.list({
        customer: args.customer,
        status: args.status,
        subscription: args.subscription,
        limit: args.limit,
        starting_after: args.starting_after,
        ending_before: args.ending_before,
        created: args.created,
        due_date: args.due_date,
        collection_method: args.collection_method,
        expand: args.expand,
    });
});

global.registerAction('stripe/invoices-draft-delete', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.invoices.del(args.id);
});

global.registerAction('stripe/invoices-attach-payment', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.invoices.attachPayment(args.id, {
        payment_intent: args.payment_intent,
    });
});

global.registerAction('stripe/invoices-finalize', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.invoices.finalizeInvoice(args.id, {
        auto_advance: args.auto_advance,
        expand: args.expand,
    });
});

global.registerAction('stripe/invoices-mark-uncollectible', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.invoices.markUncollectible(args.id, {
        expand: args.expand,
    });
});

global.registerAction('stripe/invoices-pay', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.invoices.pay(args.id, {
        forgive: args.forgive,
        off_session: args.off_session,
        paid_out_of_band: args.paid_out_of_band,
        payment_method: args.payment_method,
        source: args.source,
        mandate: args.mandate,
        expand: args.expand,
    });
});

global.registerAction('stripe/invoices-search', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.invoices.search({
        query: args.query,
        limit: args.limit,
        page: args.page,
        expand: args.expand,
    });
});

global.registerAction('stripe/invoices-send', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.invoices.sendInvoice(args.id, {
        expand: args.expand,
    });
});

global.registerAction('stripe/invoices-void', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.invoices.voidInvoice(args.id, {
        expand: args.expand,
    });
});
