import * as React from 'react'

// Config default config to test with 
export const Config = {
    namespace: process.env.NAMESPACE,
    url: process.env.API_URL,
    registry: "https://docker.io",
    apikey: "testapikey",
    secret: "test-secret",
    secretdata: "test-secret-data"
}

export function SanitizePath(path) {
    if (path === "") {
        return path
    }
    
    if (path === "/") {
        return ""
    }

    if (path.startsWith("/")) {
        return path
    }

    return "/" + path
}

// CloseEventSource closes the event source when the component unmounts
export async function CloseEventSource(eventSource) {
    if (eventSource !== null) {
        eventSource.close()
    }
}

export function TrimPathSlashes(path) {
    path.replace(/^\//, "");
    path.replace(/\/^/, "");
    return path
}

// HandleError returns a helpful message back based on the response
export async function HandleError(summary, resp, perm) {
    const contentType = resp.headers.get('content-type')

    if (resp.status === 405) {
        return `${summary}: method is not allowed`
    }

    if (resp.status !== 403) {
        if (!contentType || !contentType.includes('application/json')) {
            let text = await resp.text()
            return `${summary}: ${text}`
        } else {
            if (resp.headers.get('grpc-message')) {
                return `${summary}: ${resp.headers.get('grpc-message')}`
            } else {
                let text = (await resp.json()).message
                return `${summary}: ${text}`
            }
        }
    } else {
        return `You do not have permission to '${summary}', contact system admin to grant '${perm}'`
    }
}

export function ExtractQueryString(appendMode, ...queryParameters) {
    if (queryParameters === undefined || queryParameters.length === 0) {
        return ""
    }

    let queryString = ""
    for (let i = 0; i < queryParameters.length; i++) {
        const query = queryParameters[i];
        if (i > 0 || appendMode) {
            queryString += "&" + query
        } else {
            queryString += query
        }
    }

    if (appendMode) {
        return queryString
    }

    return `?${queryString}`
}

export function QueryStringsContainsQuery(containQuery, ...queryParameters) {
    if (queryParameters === undefined || queryParameters.length === 0) {
        return false
    }

    for (let i = 0; i < queryParameters.length; i++) {
        const query = queryParameters[i];
        if (query.startsWith(`${containQuery}=`)) {
            return true
        }
    }

    return false
}

// PageInfoProcessor: Gives new pageInfo back and whether or not to update data
// PageInfo hasNextPage and hasPreviousPage can both potentially be unreliable
// hasNextPage becomes unreliable when taversing pages backwards ("before" query is used) 
// hasPreviousPage becomes unreliable when taversing pages forward ("after" query is used) 
// Due to this uncertainty, unreliable fields will be set to true by default.
// If no new data is received and there is old data, unreliable fields will be set to their real value returned
// by the server, and data should not be updated.
export function PageInfoProcessor(oldPageInfo, newPageInfo, oldData, newData, ...queryParameters) {
    // Best guess direction of pagination
    let goingBackward = QueryStringsContainsQuery("before", ...queryParameters)
    let atStartOrEndPage = newData.length === 0 && oldData != null && oldPageInfo != null
    let out = { pageInfo: {}, shouldUpdate: false }

    // atStartOrEndPage pageInfo should be adjusted, but data should not be updated
    if (atStartOrEndPage) {
        out.pageInfo = oldPageInfo

        out.pageInfo.hasNextPage = goingBackward ? !newPageInfo.hasPreviousPage : out.pageInfo.hasNextPage
        out.pageInfo.hasPreviousPage = !goingBackward ? !newPageInfo.hasNextPage : out.pageInfo.hasPreviousPage

        out.pageInfo.hasPreviousPage = goingBackward ? newPageInfo.hasPreviousPage : out.pageInfo.hasPreviousPage
        out.pageInfo.hasNextPage = !goingBackward ? newPageInfo.hasNextPage : out.pageInfo.hasNextPage

        return out
    }

    // Update pageinfo and data
    out.pageInfo = newPageInfo

    out.pageInfo.hasNextPage = goingBackward ? true : out.pageInfo.hasNextPage
    out.pageInfo.hasPreviousPage = !goingBackward ? true : out.pageInfo.hasPreviousPage

    out.shouldUpdate = true

    return out
}

export const STATE = {
    UPDATE: 'update',
    UPDATELIST: "updateList",
};

export function StateReducer(state, action) {
    console.log("mirrorY DISPATCH STARTED")
    switch (action.type) {
        case STATE.UPDATE:
            return action.data;
        case STATE.UPDATELIST:
            const queryParams = action.queryString.split("&")
            console.log("queryParams")
            let pInfo = PageInfoProcessor(action.oldPageInfo, action.newPageInfo, state, action.edgeData, ...queryParams)
            action.setPageInfo(pInfo.pageInfo)
            if (pInfo.shouldUpdate) {
                console.log("mirrorY Updating data to = ", action.data)
                if (action.data) {
                    return action.data
                } else {
                    return action.edgeData
                }

            }

            return state
        default:
            return state
    }
}

// Auto clean eventsource when changed or unmounted
export const useEventSourceCleaner = (eventSource) => {
    const eventSourceRef = React.useRef(eventSource);

    // CLEANUP: close old eventsource and updates ref
    React.useEffect(() => {
        console.log("new event source updating ref: ", eventSource)
        eventSourceRef.current = eventSource

        return () => {
            console.log("new event source was cleaned")
            CloseEventSource(eventSource)
        }
    }, [eventSource])

    // CLEANUP: close eventsource on umount
    React.useEffect(() => {
        return () => {
            console.log("new event source was unmounted")
            CloseEventSource(eventSourceRef.current)
        }
    }, [])

    return {
        eventSourceRef
    }
}

// Handle changes to queryParameters and return new query string when changed
// throttle can be used to control how frequently to update queryString in ms. Default = 50
export const useQueryString = (appendMode, queryParameters, throttle) => {
    const [queryString, setQueryString] = React.useState("")

    React.useEffect(() => {
        // const handler = setTimeout(() => {
            let newQueryString = ExtractQueryString(appendMode, ...queryParameters)
            if (newQueryString !== queryString) {
                setQueryString(newQueryString)
            }
        // }, throttle ? throttle : 50);

        // return () => {
        //     clearTimeout(handler);
        // };
    }, [appendMode, queryParameters, queryString, throttle])

    return {
        queryString
    }
}

export const genericEventSourceErrorHandler = (error, setError) => {
    if (error.status === 404) {
        setError(error.statusText)
    } else if (error.status === 403) {
        setError("permission denied")
    }
}