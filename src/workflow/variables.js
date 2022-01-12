import * as React from 'react'
import { CloseEventSource, HandleError, ExtractQueryString } from '../util'
const {EventSourcePolyfill} = require('event-source-polyfill')
const fetch = require("isomorphic-fetch")

/*
    useWorkflowVariables is a react hook
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - namespace the namespace to send the requests to
      - path to the workflow you want to change
      - apikey to provide authentication of an apikey
*/
export const useDirektivWorkflowVariables = (url, stream, namespace, path, apikey) => {

    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/tree/${path}?op=vars`, {
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
                    setData(json.variables.edges)
                }

                listener.onmessage = e => readData(e)
                setEventSource(listener)
            }
        } else {
            if(data === null) {
                getWorkflowVariables()
            }
        }
    },[data])

    React.useEffect(()=>{
        return () => CloseEventSource(eventSource)
    },[eventSource])


    async function getWorkflowVariables(...queryParameters) {
        try {
            let uri = `${url}namespaces/${namespace}/tree/${path}?op=vars${ExtractQueryString(true, ...queryParameters)}` 
            let resp = await fetch(`${uri}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok) {
                let json = await resp.json()
                setData(json.variables.edges)
            } else {
                setErr(await HandleError('get node', resp, 'listNodes'))
            }
        } catch(e){
            setErr(e.message)
        }
    }

    async function setWorkflowVariable(name, val, mimeType,...queryParameters) {
        if(mimeType === undefined){
            mimeType = "application/json"
        }
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=set-var&var=${name}${ExtractQueryString(true, ...queryParameters)}`, {
                method: "PUT",
                body: val,
                headers: {
                    "Content-type": mimeType,
                },
            })
            if (!resp.ok) {
               return await HandleError('set variable', resp, 'setWorkflowVariable')
            }
        } catch(e) {
            return e.message
        }
    }

    async function getWorkflowVariable(name,...queryParameters) {
        try {
            let resp = await fetch(`${url}/namespaces/${namespace}/tree/${path}?op=var&var=${name}${ExtractQueryString(true, ...queryParameters)}`, {})
            if(resp.ok) {
                return {data: await resp.text(), contentType: resp.headers.get("Content-Type")}
            } else {
                return await HandleError('get variable', resp, 'getWorkflowVariable')
            }
        } catch(e) {
            return e.message
        }
    }

    async function deleteWorkflowVariable(name,...queryParameters) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=delete-var&var=${name}${ExtractQueryString(true, ...queryParameters)}`,{
                method: "DELETE"
            })
            if(!resp.ok) {
                return await HandleError('delete variable', resp, 'deleteWorkflowVariable')
            }
        } catch(e) {
            return e.message
        }
    }

    return {
        data,
        err,
        getWorkflowVariables,
        setWorkflowVariable,
        deleteWorkflowVariable,
        getWorkflowVariable
    }
}