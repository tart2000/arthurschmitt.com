const DATE_TOKEN_MAP = {
    YYYY: { year: 'numeric' },
    YY: { year: '2-digit' },
    MMMM: { month: 'long' },
    MMM: { month: 'short' },
    MM: { month: '2-digit' },
    M: { month: 'numeric' },
    DD: { day: '2-digit' },
    D: { day: 'numeric' },
    dddd: { weekday: 'long' },
    ddd: { weekday: 'short' },
    dd: { weekday: 'narrow' },
    HH: { hour: '2-digit', hour12: false },
    H: { hour: 'numeric', hour12: false },
    hh: { hour: '2-digit', hour12: true },
    h: { hour: 'numeric', hour12: true },
    mm: { minute: '2-digit' },
    m: { minute: 'numeric' },
    ss: { second: '2-digit' },
    s: { second: 'numeric' },
    SSS: { fractionalSecondDigits: 3 },
    A: { hour12: true },
    a: { hour12: true },
    Z: { timeZoneName: 'short' },
    ZZ: { timeZoneName: 'longOffset' },
};

const TOKEN_REGEX = /\[([^\]]+)]|YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|dd|HH|H|hh|h|mm|m|ss|s|SSS|A|a|ZZ|Z/g;

function parseDate(value) {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    return new Date(value);
}

function formatDateWithPattern(date, format, locale = 'en') {
    const d = parseDate(date);
    if (isNaN(d.getTime())) return 'Invalid Date';

    return format.replace(TOKEN_REGEX, match => {
        if (match.startsWith('[') && match.endsWith(']')) {
            return match.slice(1, -1);
        }

        if (match === 'A' || match === 'a') {
            const hours = d.getHours();
            const period = hours >= 12 ? 'PM' : 'AM';
            return match === 'a' ? period.toLowerCase() : period;
        }

        if (match === 'SSS') {
            return String(d.getMilliseconds()).padStart(3, '0');
        }

        const options = DATE_TOKEN_MAP[match];
        if (!options) return match;

        const formatted = new Intl.DateTimeFormat(locale, options).format(d);

        if (match === 'HH' || match === 'hh' || match === 'mm' || match === 'ss') {
            return formatted.padStart(2, '0');
        }

        return formatted;
    });
}

function getRelativeTime(date, withoutSuffix = false, locale = 'en') {
    const d = parseDate(date);
    if (isNaN(d.getTime())) return 'Invalid Date';

    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
    const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30));
    const diffYears = Math.round(diffMs / (1000 * 60 * 60 * 24 * 365));

    const rtf = new Intl.RelativeTimeFormat(locale, {
        numeric: withoutSuffix ? 'always' : 'auto',
        style: 'long',
    });

    if (Math.abs(diffSeconds) < 60) {
        return withoutSuffix
            ? new Intl.NumberFormat(locale, { style: 'unit', unit: 'second' }).format(Math.abs(diffSeconds))
            : rtf.format(diffSeconds, 'second');
    }
    if (Math.abs(diffMinutes) < 60) {
        return withoutSuffix
            ? new Intl.NumberFormat(locale, { style: 'unit', unit: 'minute' }).format(Math.abs(diffMinutes))
            : rtf.format(diffMinutes, 'minute');
    }
    if (Math.abs(diffHours) < 24) {
        return withoutSuffix
            ? new Intl.NumberFormat(locale, { style: 'unit', unit: 'hour' }).format(Math.abs(diffHours))
            : rtf.format(diffHours, 'hour');
    }
    if (Math.abs(diffDays) < 7) {
        return withoutSuffix
            ? new Intl.NumberFormat(locale, { style: 'unit', unit: 'day' }).format(Math.abs(diffDays))
            : rtf.format(diffDays, 'day');
    }
    if (Math.abs(diffWeeks) < 4) {
        return withoutSuffix
            ? new Intl.NumberFormat(locale, { style: 'unit', unit: 'week' }).format(Math.abs(diffWeeks))
            : rtf.format(diffWeeks, 'week');
    }
    if (Math.abs(diffMonths) < 12) {
        return withoutSuffix
            ? new Intl.NumberFormat(locale, { style: 'unit', unit: 'month' }).format(Math.abs(diffMonths))
            : rtf.format(diffMonths, 'month');
    }
    return withoutSuffix
        ? new Intl.NumberFormat(locale, { style: 'unit', unit: 'year' }).format(Math.abs(diffYears))
        : rtf.format(diffYears, 'year');
}

function getDayOfYear(date) {
    const d = parseDate(date);
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

function getWeekOfYear(date) {
    const d = parseDate(date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}

export const dateFormulas = {
    date(...args) {
        if (args.length === 0) {
            return new Date().toISOString();
        }
        if (args.length === 1) {
            const d = parseDate(args[0]);
            return isNaN(d.getTime()) ? 'Invalid Date' : d.toISOString();
        }
        const [year, month = 0, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0] = args;
        const d = new Date(year, month, day, hour, minute, second, millisecond);
        return isNaN(d.getTime()) ? 'Invalid Date' : d.toISOString();
    },

    formatDate(date, format = 'YYYY-MM-DD', locale = 'en') {
        return formatDateWithPattern(date, format, locale);
    },

    fromTime(date, withoutSuffix = false, locale = 'en') {
        return getRelativeTime(date, withoutSuffix, locale);
    },

    compareDate(date1, date2, precision = 'millisecond', asFloat = false) {
        const d1 = parseDate(date1);
        const d2 = parseDate(date2);

        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
            return NaN;
        }

        let diff = d1.getTime() - d2.getTime();

        const divisors = {
            millisecond: 1,
            second: 1000,
            minute: 1000 * 60,
            hour: 1000 * 60 * 60,
            day: 1000 * 60 * 60 * 24,
            week: 1000 * 60 * 60 * 24 * 7,
            month: 1000 * 60 * 60 * 24 * 30,
            year: 1000 * 60 * 60 * 24 * 365,
        };

        const divisor = divisors[precision] || 1;
        const result = diff / divisor;

        return asFloat ? result : Math.trunc(result);
    },

    getSecond(date) {
        return parseDate(date).getSeconds();
    },

    getMinute(date) {
        return parseDate(date).getMinutes();
    },

    getHour(date) {
        return parseDate(date).getHours();
    },

    getDay(date) {
        return parseDate(date).getDate();
    },

    getDayOfWeek(date) {
        return parseDate(date).getDay();
    },

    getMonth(date) {
        return parseDate(date).getMonth();
    },

    getYear(date) {
        return parseDate(date).getFullYear();
    },

    getDayOfYear(date) {
        return getDayOfYear(date);
    },

    getWeekOfYear(date) {
        return getWeekOfYear(date);
    },

    addSeconds(date, amount) {
        const d = parseDate(date);
        d.setSeconds(d.getSeconds() + amount);
        return d.toISOString();
    },

    addMinutes(date, amount) {
        const d = parseDate(date);
        d.setMinutes(d.getMinutes() + amount);
        return d.toISOString();
    },

    addHours(date, amount) {
        const d = parseDate(date);
        d.setHours(d.getHours() + amount);
        return d.toISOString();
    },

    addDays(date, amount) {
        const d = parseDate(date);
        d.setDate(d.getDate() + amount);
        return d.toISOString();
    },

    addMonths(date, amount) {
        const d = parseDate(date);
        d.setMonth(d.getMonth() + amount);
        return d.toISOString();
    },

    addYears(date, amount) {
        const d = parseDate(date);
        d.setFullYear(d.getFullYear() + amount);
        return d.toISOString();
    },

    setSecond(date, value) {
        const d = parseDate(date);
        d.setSeconds(value);
        return d.toISOString();
    },

    setMinute(date, value) {
        const d = parseDate(date);
        d.setMinutes(value);
        return d.toISOString();
    },

    setHour(date, value) {
        const d = parseDate(date);
        d.setHours(value);
        return d.toISOString();
    },

    setDay(date, value) {
        const d = parseDate(date);
        d.setDate(value);
        return d.toISOString();
    },

    setDayOfWeek(date, value) {
        const d = parseDate(date);
        const currentDay = d.getDay();
        const diff = value - currentDay;
        d.setDate(d.getDate() + diff);
        return d.toISOString();
    },

    setMonth(date, value) {
        const d = parseDate(date);
        d.setMonth(value);
        return d.toISOString();
    },

    setYear(date, value) {
        const d = parseDate(date);
        d.setFullYear(value);
        return d.toISOString();
    },

    toTimestamp(date) {
        const d = parseDate(date);
        return isNaN(d.getTime()) ? NaN : d.getTime();
    },

    getServerTimezone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    },

    convertDateTimezone(date, timezone, preserveLocalTime = false) {
        const d = parseDate(date);
        if (isNaN(d.getTime())) return 'Invalid Date';

        if (preserveLocalTime) {
            const localString = d.toLocaleString('en-US', { timeZone: timezone });
            const targetDate = new Date(localString);
            const offset = d.getTime() - targetDate.getTime();
            return new Date(d.getTime() + offset).toISOString();
        }

        const options = {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        };

        const formatter = new Intl.DateTimeFormat('en-CA', options);
        const parts = formatter.formatToParts(d);
        const values = {};
        for (const part of parts) {
            values[part.type] = part.value;
        }

        return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}.${String(d.getMilliseconds()).padStart(3, '0')}Z`;
    },

    formatDateTimezone(date, format = 'YYYY-MM-DD HH:mm:ss', timezone, locale = 'en') {
        const d = parseDate(date);
        if (isNaN(d.getTime())) return 'Invalid Date';

        if (!timezone) {
            return formatDateWithPattern(d, format, locale);
        }

        const options = {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
            hour12: false,
        };

        const formatter = new Intl.DateTimeFormat('en-CA', options);
        const parts = formatter.formatToParts(d);
        const values = {};
        for (const part of parts) {
            values[part.type] = part.value;
        }

        const tzDate = new Date(
            parseInt(values.year),
            parseInt(values.month) - 1,
            parseInt(values.day),
            parseInt(values.hour),
            parseInt(values.minute),
            parseInt(values.second),
            d.getMilliseconds()
        );

        return formatDateWithPattern(tzDate, format, locale);
    },
};
