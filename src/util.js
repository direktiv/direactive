// Config default config to test with 
export const  Config = {
    namespace: process.env.NAMESPACE,
    url: process.env.API_URL,
    registry: "https://docker.io",
    apikey: "testapikey",
    secret: "test-secret",
    secretdata: "test-secret-data"
}

// CloseEventSource closes the event source when the component unmounts
export async function CloseEventSource(eventSource) {
    if (eventSource !== null) {
        eventSource.close()
    }
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
          if(resp.headers.get('grpc-message')) {
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
    if (queryParameters === undefined || queryParameters.length === 0){
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
    if (queryParameters === undefined || queryParameters.length === 0){
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