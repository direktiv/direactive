import * as React from 'react'
import fetch from "cross-fetch"
import { CloseEventSource, HandleError } from '../util'
const {EventSourcePolyfill} = require('event-source-polyfill')

/*
    useNamespaceVariables is a react hook
    takes:
      - url to direktiv api http://x/api/
      - namespace to use with the api
      - apikey to provide authentication of an apikey
*/

export const useDirektivNamespaceVariables = (url, stream, namespace, apikey) => {

    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/vars`, {
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
                getNamespaceVariables()
            }
        }
    },[data])

    React.useEffect(()=>{
        return () => {
            CloseEventSource(eventSource)
        }
    },[eventSource])

    // getNamespaces returns a list of namespaces
    async function getNamespaceVariables() {
        try {
            // fetch namespace list by default
            let resp = await fetch(`${url}namespaces/${namespace}/vars`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok) {
                let json = await resp.json()
                setData(json.variables.edges)
            } else {
                setErr(await HandleError('list namespace variables', resp, 'namespaceVars'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function getNamespaceVariable(name) {
        try {
            let resp = await fetch(`${url}/namespaces/${namespace}/vars/${name}`, {})
            if(resp.ok) {
                return {data: await resp.text(), contentType: resp.headers.get("Content-Type")}
            } else {
                setErr(await HandleError('get variable', resp, 'getNamespaceVariable'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function deleteNamespaceVariable(name) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/vars/${name}`,{
                method: "DELETE"
            })
            if(!resp.ok) {
                setErr(await HandleError('delete variable', resp, 'deleteNamespaceVariable'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function setNamespaceVariable(name, val, mimeType) {
        if(mimeType === undefined){
            mimeType = "application/json"
        }
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/vars/${name}`, {
                method: "PUT",
                body: val,
                headers: {
                    "Content-type": mimeType,
                },
            })
            if (!resp.ok) {
               setErr(await HandleError('set variable', resp, 'setNamespaceVariable'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    return {
        data,
        err,
        getNamespaceVariables,
        getNamespaceVariable,
        deleteNamespaceVariable,
        setNamespaceVariable
    }

}