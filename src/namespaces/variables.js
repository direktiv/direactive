import * as React from 'react'
import { CloseEventSource, HandleError, ExtractQueryString } from '../util'
const {EventSourcePolyfill} = require('event-source-polyfill')
const fetch = require('isomorphic-fetch')

/*
    useNamespaceVariables is a react hook
    takes:
      - url to direktiv api http://x/api/
      - namespace to use with the api
      - apikey to provide authentication of an apikey
*/

export const useDirektivNamespaceVariables = (url, stream, namespace, apikey, ...queryParameters) => {

    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    // Store Query parameters
    const [queryString, setQueryString] = React.useState(ExtractQueryString(false, ...queryParameters))

    // Stores PageInfo about namespace variable list stream
    const [pageInfo, setPageInfo] = React.useState(null)
    const [totalCount , setTotalCount] = React.useState(null)

    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/vars${queryString}`, {
                    headers: apikey === undefined ? {}:{"apikey": apikey}
                })

                listener.onerror = (e) => {
                    if (e.status === 404) {
                  setErr(e.statusText)
                } else if(e.status === 403) {
                        setErr("permission denied")
                    }
                }

                async function readData(e) {
                    if(e.data === "") {
                        return
                    }
                    let json = JSON.parse(e.data)
                    setData(json.variables.edges)
                    setPageInfo(json.variables.pageInfo)
                    setTotalCount(json.variables.totalCount)
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

    // If queryParameters change and streaming: update queryString, and reset sse connection
    React.useEffect(()=>{
        if(stream){
            let newQueryString = ExtractQueryString(false, ...queryParameters)
            if (newQueryString !== queryString) {
                setQueryString(newQueryString)
                CloseEventSource(eventSource)
                setEventSource(null)
            }
        }
    },[eventSource, queryParameters, queryString, stream])

    // getNamespaces returns a list of namespaces
    async function getNamespaceVariables(...queryParameters) {
        // fetch namespace list by default
        let resp = await fetch(`${url}namespaces/${namespace}/vars${ExtractQueryString(false, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            let json = await resp.json()
            setData(json.variables.edges)
            setPageInfo(json.variables.pageInfo)
            setTotalCount(json.variables.totalCount)
        } else {
            throw new Error((await HandleError('list namespace variables', resp, 'namespaceVars')))
        }
    }

    async function getNamespaceVariable(name, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/vars/${name}${ExtractQueryString(false, ...queryParameters)}`, {})
        if (resp.ok) {
            return { data: await resp.text(), contentType: resp.headers.get("Content-Type") }
        } else {
            throw new Error(await HandleError('get variable', resp, 'getNamespaceVariable'))
        }
    }

    async function getNamespaceVariableBuffer(name, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/vars/${name}${ExtractQueryString(false, ...queryParameters)}`, {})
        if (resp.ok) {
            return { data: await resp.arrayBuffer(), contentType: resp.headers.get("Content-Type") }
        } else {
            throw new Error(await HandleError('get variable', resp, 'getNamespaceVariable'))
        }
    }

    async function deleteNamespaceVariable(name, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/vars/${name}${ExtractQueryString(false, ...queryParameters)}`, {
            method: "DELETE"
        })
        if (!resp.ok) {
            throw new Error(await HandleError('delete variable', resp, 'deleteNamespaceVariable'))
        }
    }

    async function setNamespaceVariable(name, val, mimeType, ...queryParameters) {
        if (mimeType === undefined) {
            mimeType = "application/json"
        }
        let resp = await fetch(`${url}namespaces/${namespace}/vars/${name}${ExtractQueryString(false, ...queryParameters)}`, {
            method: "PUT",
            body: val,
            headers: {
                "Content-type": mimeType,
            },
        })
        if (!resp.ok) {
            throw new Error(await HandleError('set variable', resp, 'setNamespaceVariable'))
        }
    }

    return {
        data,
        err,
        pageInfo,
        totalCount,
        getNamespaceVariables,
        getNamespaceVariable,
        getNamespaceVariableBuffer,
        deleteNamespaceVariable,
        setNamespaceVariable
    }

}