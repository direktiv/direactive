import * as React from 'react'
import {EventSourcePolyfill} from 'event-source-polyfill'
import fetch from "cross-fetch"

/*
    useNamespaces is a react hook which returns createNamespace, deleteNamespace and data
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - apikey to provide authentication of an apikey
*/
export const useNamespaces = (url, stream, apikey) => {
    
    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces`, {
                    headers: apikey === undefined ? {}:{"apikey": apikey}
                })

                listener.onerror = (e) => {
                    if(e.status === 403) {
                        setErr("permission denied")
                    }
                }

                async function readData(e) {
                    let json = JSON.parse(e.data)
                    setData(json.edges)
                }

                listener.onmessage = e => readData(e)
                setEventSource(listener)
            }
        } else {
            if(data === null) {
                getNamespaces()
            }
        }
    },[data])

    React.useEffect(()=>{
        return () => {
            if (eventSource !== null) {
                eventSource.close()
            }
        }
    },[eventSource])

    // getNamespaces returns a list of namespaces
    async function getNamespaces() {
        try {
            // fetch namespace list by default
            let resp = await fetch(`${url}namespaces`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            let json = await resp.json()
            setData(json.edges)
        } catch(e) {
            setErr(e.message)
        }
    }

    // createNamespace creates a namespace from direktiv
    async function createNamespace(namespace) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}`, {
                method: "PUT",
            })
            if(resp.ok) {
                return namespace
            } else {
                // do something
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    // deleteNamespace deletes a namespace from direktiv
    async function deleteNamespace(namespace) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}?recursive=true`,{
                method:"DELETE"
            })
            if(resp.ok) {
                return
            } else {
                // do something
                // await handleError('delete namespace', resp, "deleteNamespace")
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    return {
        data,
        err,
        createNamespace,
        deleteNamespace,
        getNamespaces
    }
}
