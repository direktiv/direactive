import * as React from 'react'
import fetch from "cross-fetch"
import { CloseEventSource, HandleError } from '../util'
const {EventSourcePolyfill} = require('event-source-polyfill')

/*
    useNamespaceLogs is a react hook which returns data, err or getNamespaceLogs()
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - namespace to call the api on
      - apikey to provide authentication of an apikey
*/
export const useDirektivNamespaceLogs = (url, stream, namespace, apikey) => {

    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/logs`, {
                    headers: apikey === undefined ? {}:{"apikey": apikey}
                })

                listener.onerror = (e) => {
                    if(e.status === 403) {
                        setErr("permission denied")
                    }
                }

                async function readData(e) {
                    if(e.data === "") {
                        return
                    }
                    let json = JSON.parse(e.data)
                    setData(json.edges)
                }

                listener.onmessage = e => readData(e)
                setEventSource(listener)
            }
        } else {
            if(data === null) {
                getNamespaceLogs()
            }
        }
    },[data])

    React.useEffect(()=>{
        return () => {
            CloseEventSource(eventSource)
        }
    },[eventSource])

    // getNamespaces returns a list of namespaces
    async function getNamespaceLogs() {
        try {
            // fetch namespace list by default
            let resp = await fetch(`${url}namespaces/${namespace}/logs`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok) {
                let json = await resp.json()
                setData(json.edges)
            } else {
                setErr(await HandleError('list namespace logs', resp, 'namespaceLogs'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }


    return {
        data,
        err,
        getNamespaceLogs
    }
}