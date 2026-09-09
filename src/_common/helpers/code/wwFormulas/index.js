import { get, isEqual } from 'lodash-es';
import { escape } from 'html-escaper';

import { isPlainObject } from '@/_common/helpers/objectGuards';
import { useBackAuthStore } from '@/pinia/backAuth.js';

import { createWwFormulas } from './core';
import { dateFormulas } from './dateFormulas';

export const _wwFormulas = createWwFormulas({
    date: {
        getLanguage() {
            try {
                return wwLib?.$store?.getters?.['front/getLang'] || 'en';
            } catch {
                return 'en';
            }
        },
        getRealtimeDate() {
            return dateFormulas.dateRealtime();
        },
    },
    createObjectUrl: value => URL.createObjectURL(value),
    escapeHtml: escape,
    get,
    getDataFromCollection: value => wwLib.wwUtils.getDataFromCollection(value),
    isEmpty: value => wwLib.wwUtils.isEmpty(value),
    isEqual,
    isPlainObject,
    logError: message => wwLib.wwLog.error(message),
    matchAnyRoles(args) {
        return useBackAuthStore(wwLib.$pinia).matchAnyRoles(args);
    },
    matchAllRoles(args) {
        return useBackAuthStore(wwLib.$pinia).matchAllRoles(args);
    },
    translate: text => wwLib.wwLang.getText(text),
});

export { WW_FORMULAS_CATEGORIES } from './core';
