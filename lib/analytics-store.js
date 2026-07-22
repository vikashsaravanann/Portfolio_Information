const analyticsStore = {
    totals: {
        chatMessages: 0,
        chatResponses: 0,
        contactConversions: 0,
        modelChanges: 0
    },
    intents: {},
    models: {},
    updatedAt: null
};

function increment(map, key) {
    if (!key) return;
    map[key] = (map[key] || 0) + 1;
}

function recordEvent(event) {
    if (!event || typeof event.type !== 'string') {
        return { ok: false, error: 'Event type is required.' };
    }

    const type = event.type;
    const data = event.data && typeof event.data === 'object' ? event.data : {};

    switch (type) {
        case 'chat_message':
            analyticsStore.totals.chatMessages += 1;
            break;
        case 'chat_response':
            analyticsStore.totals.chatResponses += 1;
            break;
        case 'contact_conversion':
            analyticsStore.totals.contactConversions += 1;
            break;
        case 'model_change':
            analyticsStore.totals.modelChanges += 1;
            increment(analyticsStore.models, data.model);
            break;
        case 'quick_chip':
            increment(analyticsStore.intents, data.label);
            break;
        case 'broadcast_login_failed':
            increment(analyticsStore.intents, 'broadcast_login_failed');
            break;
        default:
            return { ok: false, error: 'Unsupported event type.' };
    }

    analyticsStore.updatedAt = new Date().toISOString();
    return { ok: true };
}

function getStats() {
    return {
        totals: analyticsStore.totals,
        intents: analyticsStore.intents,
        models: analyticsStore.models,
        updatedAt: analyticsStore.updatedAt
    };
}

module.exports = {
    recordEvent,
    getStats
};
