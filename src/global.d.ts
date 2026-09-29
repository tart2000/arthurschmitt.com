import type { BetterFetchOption } from '@better-fetch/fetch';
import type { AxiosInstance } from 'axios';
import type { EditorDragStore } from '@/_common/editor/store/editorDragStore';

// Global type declarations for WeWeb

declare global {
    interface WwLib {
        editorDragStore: EditorDragStore;
        [key: string]: any;
    }

    const wwLib: WwLib;
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
