import * as React from 'react'
import { CloseEventSource, HandleError, ExtractQueryString } from '../util'
const fetch = require('isomorphic-fetch')
const {EventSourcePolyfill} = require('event-source-polyfill')

/*
    useInstances is a react hook which returns a list of instances
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - namespace the namespace to send the requests to
      - apikey to provide authentication of an apikey
*/
export const useDirektivInstances = (url, stream, namespace, apikey) => {
    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/instances`, {
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
                    setData(json.instances.edges)
                }

                listener.onmessage = e => readData(e)
                setEventSource(listener)
            }
        } else {
            if(data === null) {
                getInstances()
            }
        }
    },[data, eventSource])

    React.useEffect(()=>{
        return () => CloseEventSource(eventSource)
    },[eventSource])


    // getInstances returns a list of instances
    async function getInstances(...queryParameters) {
        try {
            // fetch instance list by default
            let resp = await fetch(`${url}namespaces/${namespace}/instances${ExtractQueryString(false, ...queryParameters)}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok){
                let json = await resp.json()
                setData(json.instances.edges)
            } else {
                setErr(await HandleError('list instances', resp, "listInstances"))
            }
        } catch(e) {
            setErr(e.message)
        }
    }
    
    return {
        data,
        err,
        getInstances
    }
}
