import Stripe from 'stripe';

global.registerAction('stripe/products-create', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.products.create({
        name: args.name,
        active: args.active,
        description: args.description,
        images: args.images,
        url: args.url,
        metadata: args.metadata,
        default_price_data: args.default_price_data,
        shippable: args.shippable,
        statement_descriptor: args.statement_descriptor,
        tax_code: args.tax_code,
        unit_label: args.unit_label,
        id: args.id,
        marketing_features: args.marketing_features,
        package_dimensions: args.package_dimensions,
        expand: args.expand,
    });
});

global.registerAction('stripe/products-update', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.products.update(args.id, {
        name: args.name,
        active: args.active,
        description: args.description,
        images: args.images,
        url: args.url,
        default_price: args.default_price,
        metadata: args.metadata,
        shippable: args.shippable,
        statement_descriptor: args.statement_descriptor,
        tax_code: args.tax_code,
        unit_label: args.unit_label,
        marketing_features: args.marketing_features,
        package_dimensions: args.package_dimensions,
        expand: args.expand,
    });
});

global.registerAction('stripe/products-retrieve', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.products.retrieve(args.id, {
        expand: args.expand,
    });
});

global.registerAction('stripe/products-list', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.products.list({
        active: args.active,
        limit: args.limit,
        starting_after: args.starting_after,
        ending_before: args.ending_before,
        created: args.created,
        ids: args.ids,
        shippable: args.shippable,
        url: args.url,
        type: args.type,
        expand: args.expand,
    });
});

global.registerAction('stripe/products-delete', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.products.del(args.id);
});

global.registerAction('stripe/products-search', async ({ args }: ActionParams, context: ActionContext) => {
    const stripeClient = new Stripe(context.connection?.secretApiKey);

    return await stripeClient.products.search({
        query: args.query,
        limit: args.limit,
        page: args.page,
        expand: args.expand,
    });
});
