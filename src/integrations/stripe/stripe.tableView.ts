import Stripe from 'stripe';

global.registerTableView('stripe', async (connection: ConnectionConfig, table: TableConfig, view: ViewConfig) => {
    const result = await fetchData(connection, table, view);

    return {
        data: result.data,
        metadata: {
            limit: view.limit || 10,
            offset: view._action === 'search' ? view.offset || 1 : view.offset || null,
            nextOffset: result.has_more
                ? view._action === 'search'
                    ? (view.offset || 1) + 1
                    : result.data?.[result.data.length - 1]?.id
                : null,
        },
    };
});

async function fetchData(connection: ConnectionConfig, table: TableConfig, view: ViewConfig) {
    const stripeClient = new Stripe(connection?.secretApiKey);

    if (view._action === 'search') {
        return await stripeClient[table.resource].search({
            query: view.query,
            limit: view.limit,
            page: view.offset,
            expand: view.expand,
        });
    }

    switch (table.resource) {
        case 'products': {
            return await stripeClient.products.list({
                active: view.active,
                limit: view.limit,
                starting_after: view.offset,
                created: view.created,
                ids: view.ids,
                shippable: view.shippable,
                url: view.url,
                expand: view.expand,
            });
        }
        case 'prices': {
            return await stripeClient.prices.list({
                active: view.active,
                currency: view.currency,
                product: view.product,
                type: view.type,
                limit: view.limit,
                starting_after: view.offset,
                created: view.created,
                recurring: view.recurring,
                expand: view.expand,
            });
        }
        case 'customers': {
            return await stripeClient.customers.list({
                email: view.email,
                limit: view.limit,
                starting_after: view.offset,
                created: view.created,
                expand: view.expand,
            });
        }
        case 'invoices': {
            return await stripeClient.invoices.list({
                customer: view.customer,
                status: view.status,
                subscription: view.subscription,
                limit: view.limit,
                starting_after: view.offset,
                created: view.created,
                due_date: view.dueDate,
                expand: view.expand,
            });
        }
        case 'subscriptions': {
            return await stripeClient.subscriptions.list({
                customer: view.customer,
                price: view.price,
                status: view.status,
                limit: view.limit,
                starting_after: view.offset,
                collection_method: view.collectionMethod,
                created: view.created,
                current_period_start: view.currentPeriodStart,
                current_period_end: view.currentPeriodEnd,
                expand: view.expand,
            });
        }
        case 'payments': {
            return await stripeClient.paymentIntents.list({
                customer: view.customer,
                limit: view.limit,
                starting_after: view.offset,
                created: view.created,
                expand: view.expand,
            });
        }
        default:
            throw new Error(`Unsupported Stripe type: ${table.resource}`);
    }
}
