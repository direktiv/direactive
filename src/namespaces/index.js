import * as React from 'react'
import { CloseEventSource, HandleError, ExtractQueryString } from '../util'
const {EventSourcePolyfill} = require('event-source-polyfill')
const fetch = require('isomorphic-fetch')

/*
    useNamespaces is a react hook which returns createNamespace, deleteNamespace and data
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - apikey to provide authentication of an apikey
*/
export const useDirektivNamespaces = (url, stream, apikey) => {
    
    const [data, setData] = React.useState(null)
    const [load, setLoad] = React.useState(true)
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                    // setup event listener 
                    let listener = new EventSourcePolyfill(`${url}namespaces`, {
                        headers: !apikey ? {}:{"apikey": apikey}
                    })

                    listener.onerror = (e) => {
                        setErr(e)
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
                    setLoad(false)
                    setErr("")
            }
        } else {
            if(data === null) {
                getNamespaces()
            }
        }
    },[data])

    React.useEffect(()=>{
        if(!load && eventSource !== null) {
            CloseEventSource(eventSource)
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
                if(e.data === "") {
                    return
                }
                let json = JSON.parse(e.data)
                setData(json.edges)
            }

            listener.onmessage = e => readData(e)
            setEventSource(listener)
            setErr("")
        }
    },[apikey])

    React.useEffect(()=>{
        return () => {
            CloseEventSource(eventSource)
        }
    },[eventSource])

    // getNamespaces returns a list of namespaces
    async function getNamespaces(...queryParameters) {
        try {
            // fetch namespace list by default
            let resp = await fetch(`${url}namespaces${ExtractQueryString(false, queryParameters)}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok) {
                let json = await resp.json()
                setData(json.edges)
            } else {
                setErr(await HandleError('list namespaces', resp, 'listNamespaces'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    // createNamespace creates a namespace from direktiv
    async function createNamespace(namespace, ...queryParameters) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}${ExtractQueryString(false, queryParameters)}`, {
                method: "PUT",
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if(!resp.ok){
                return await HandleError('create a namespace', resp, 'addNamespace')
            } 
        } catch(e) {
            return e.message
        }
    }

    // deleteNamespace deletes a namespace from direktiv
    async function deleteNamespace(namespace, ...queryParameters) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}?recursive=true${ExtractQueryString(true, queryParameters)}`,{
                method:"DELETE",
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if(!resp.ok) {
                return await HandleError('delete a namespace', resp, 'deleteNamespace')
            }
        } catch(e) {
            return e.message
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
