import type { BetterFetchOption } from '@better-fetch/fetch';
import type { AxiosInstance } from 'axios';

// Global type declarations for WeWeb

declare global {
    const wwLib: any;
    const userflow: any;
    const wwAxios: AxiosInstance;
    type WwServerRequestOptions<T = unknown> = BetterFetchOption<
        unknown,
        Record<string, unknown>,
        Record<string, unknown> | Array<string> | undefined,
        T
    >;
    function wwServerClient<T = unknown>(url: string, options?: WwServerRequestOptions<T>): Promise<T>;
    interface Window {
        wwLib: typeof wwLib;
        userflow: typeof userflow;
        wwAxios: typeof wwAxios;
        wwServerClient: typeof wwServerClient;
    }
}

export {};
