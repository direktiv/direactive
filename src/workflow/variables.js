import * as React from 'react'
import fetch from "cross-fetch"
import { CloseEventSource, HandleError } from '../util'
const {EventSourcePolyfill} = require('event-source-polyfill')

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


    async function getWorkflowVariables() {
        try {
            let uri = `${url}namespaces/${namespace}/tree/${path}?op=vars` 
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

    async function setWorkflowVariable(name, val, mimeType) {
        if(mimeType === undefined){
            mimeType = "application/json"
        }
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=set-var&var=${name}`, {
                method: "PUT",
                body: val,
                headers: {
                    "Content-type": mimeType,
                },
            })
            if (!resp.ok) {
               setErr(await HandleError('set variable', resp, 'setWorkflowVariable'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function getWorkflowVariable(name) {
        try {
            let resp = await fetch(`${url}/namespaces/${namespace}/tree/${path}?op=var&var=${name}`, {})
            if(resp.ok) {
                return {data: await resp.text(), contentType: resp.headers.get("Content-Type")}
            } else {
                setErr(await HandleError('get variable', resp, 'getWorkflowVariable'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function deleteWorkflowVariable(name) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=delete-var&var=${name}`,{
                method: "DELETE"
            })
            if(!resp.ok) {
                setErr(await HandleError('delete variable', resp, 'setWorkflowVariable'))
            }
        } catch(e) {
            setErr(e.message)
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