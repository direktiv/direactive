// Config default config to test with 
export const  Config = {
    namespace: "test",
    url: "http://172.16.67.147/api/"
}

// HandleError returns a helpful message back based on the response
export async function HandleError(summary, resp) {
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