import qs from 'qs';
import { consumeEventStream } from './utils/streamHandler';

export default {
    /*=============================================m_ÔÔ_m=============================================\
        Collection API
    \================================================================================================*/
    async _fetchCollection(collection) {
        if (collection.mode === 'dynamic' && !collection.config.isThroughServer) {
            try {
                const { url, method, data, headers, queries, resultKey, dataType, useRawBody, isWithCredentials } =
                    collection.config;
                const responseData = await this._apiRequest(
                    url,
                    method,
                    data,
                    headers,
                    queries,
                    dataType,
                    useRawBody,
                    isWithCredentials
                );
                return { data: _.get(responseData, resultKey, responseData), error: null };
            } catch (err) {
                return {
                    error: Object.getOwnPropertyNames(err).reduce((obj, key) => ({ ...obj, [key]: err[key] }), {}),
                };
            }
        } else {
            return { data: null, error: null };
        }
    },
    async apiRequest(
        {
            url,
            method,
            data,
            headers,
            queries: params,
            dataType,
            isThroughServer,
            useRawBody = false,
            isWithCredentials = false,
            useStreaming = false,
            streamVariableId = null,
        },
        wwUtils
    ) {

        if (useStreaming) {
            if (isThroughServer) {
                throw new Error('Streaming is not supported with server-side requests.');
            }
            return await this._streamApiRequest(
                url,
                method,
                data,
                headers,
                params,
                dataType,
                useRawBody,
                isWithCredentials,
                streamVariableId,
                wwUtils
            );
        } else if (isThroughServer) {
            const websiteId = wwLib.wwWebsiteData.getInfo().id;
            const pluginURL = wwLib.wwApiRequests._getPluginsUrl();

            return await axios.post(`${pluginURL}/designs/${websiteId}/rest-api/request`, {
                url,
                method,
                data,
                queries: params,
                headers,
                dataType,
                useRawBody,
            });
        } else {
            return await this._apiRequest(url, method, data, headers, params, dataType, useRawBody, isWithCredentials);
        }
    },
    async _apiRequest(url, method, data, headers, params, dataType, useRawBody, isWithCredentials) {
        const payload = computePayload(method, data, headers, params, dataType, useRawBody);

        const response = await axios({
            url,
            method,
            data: payload.data,
            params: payload.params,
            headers: payload.headers,
            withCredentials: isWithCredentials,
        });

        return response.data;
    },
    async _streamApiRequest(
        url,
        method,
        data,
        headers,
        params,
        dataType,
        useRawBody,
        isWithCredentials,
        streamVariableId,
        wwUtils
    ) {
        try {
            wwLib.wwVariable.updateValue(streamVariableId, []);

            const payload = computePayload(method, data, headers, params, dataType, useRawBody, wwUtils);

            const streamHeaders = {
                ...payload.headers,
                Accept: 'text/event-stream',
            };

            const response = await fetch(url, {
                method,
                headers: streamHeaders,
                body: ['GET', 'HEAD'].includes(method) ? undefined : payload.data,
                credentials: isWithCredentials ? 'include' : 'same-origin',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error ${response.status}: ${errorText}`);
            }

            return await consumeEventStream(response, streamVariableId, wwUtils);
        } catch (error) {
            wwUtils?.log('error', '[REST API Stream] Error', {
                type: 'error',
                preview: {
                    message: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    },
};

function computePayload(method, data, headers, params, dataType, useRawBody, wwUtils) {
    try {
        let processedData = data;
        if (!useRawBody) {
            processedData = computeList(data, 'data', wwUtils);

            switch (dataType) {
                case 'application/x-www-form-urlencoded': {
                    processedData = qs.stringify(processedData);
                    break;
                }
                case 'multipart/form-data': {
                    const formData = new FormData();
                    for (const key in processedData) formData.append(key, processedData[key]);
                    processedData = formData;
                    break;
                }
                default:
                    break;
            }
        }

        switch (method) {
            case 'OPTIONS':
            case 'GET':
            case 'DELETE':
            default:
                break;
        }

        const processedParams = computeList(params, 'params', wwUtils);
        const processedHeaders = {
            'content-type': dataType || 'application/json',
            ...computeList(headers, 'headers', wwUtils),
        };

        return {
            data: processedData,
            params: processedParams,
            headers: processedHeaders,
        };
    } catch (error) {
        wwUtils?.log('error', '[REST API] Error in computePayload', {
            type: 'error',
            preview: {
                error: error.message,
                stack: error.stack,
            },
        });
        throw error;
    }
}

function computeList(list, label, wwUtils) {
    try {
        if (!list) return {};

        if (!Array.isArray(list)) {
            wwUtils?.log('warn', `[REST API] computeList expected array but got ${typeof list}`, {
                type: 'warn',
                preview: list,
            });
            return {};
        }

        const result = (list || []).reduce((obj, item) => {
            if (!item || typeof item !== 'object' || !('key' in item)) {
                wwUtils?.log('warn', `[REST API] computeList skipping invalid item`, {
                    type: 'warn',
                    preview: item,
                });
                return obj;
            }
            return { ...obj, [item.key]: item.value };
        }, {});

        return result;
    } catch (error) {
        wwUtils?.log('error', `[REST API] Error in computeList for ${label}`, {
            type: 'error',
            preview: {
                error: error.message,
                stack: error.stack,
                list: typeof list === 'undefined' ? 'undefined' : list === null ? 'null' : list,
            },
        });
        throw new Error(`Failed to process ${label}: ${error.message}`);
    }
}
