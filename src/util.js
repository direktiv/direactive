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
    let queryString = ""
    for (let i = 0; i < queryParameters.length; i++) {
        const query = queryParameters[i];
        if (i > 0 || appendMode) {
            queryString += `&${query}`
        } else {
            queryString += query
        }
    }

    if (appendMode) {
        return queryString
    }

    return `?${queryString}`
}