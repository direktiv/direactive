import * as React from 'react'
import { useEventSourceCleaner, HandleError, ExtractQueryString, StateReducer, useQueryString, STATE, genericEventSourceErrorHandler } from '../util'
const { EventSourcePolyfill } = require('event-source-polyfill')
const fetch = require('isomorphic-fetch')

/*
    useNamespaceVariables is a react hook
    takes:
      - url to direktiv api http://x/api/
      - namespace to use with the api
      - apikey to provide authentication of an apikey
*/

export const useDirektivNamespaceVariables = (url, stream, namespace, apikey, ...queryParameters) => {

    const [data, dispatchData] = React.useReducer(StateReducer, null)
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)
    const { eventSourceRef } = useEventSourceCleaner(eventSource);

    // Store Query parameters
    const { queryString } = useQueryString(false, queryParameters)
    const [pathString, setPathString] = React.useState(null)

    // Stores PageInfo about node list stream
    const [pageInfo, setPageInfo] = React.useState(null)
    const pageInfoRef = React.useRef(pageInfo)
    const [totalCount, setTotalCount] = React.useState(null)

     // Stream Event Source Data Dispatch Handler
     React.useEffect(() => {
        if (stream && pathString !== null) {
            // setup event listener 
            let listener = new EventSourcePolyfill(`${pathString}${queryString}`, {
                headers: apikey === undefined ? {} : { "apikey": apikey }
            })

            listener.onerror = (e) => { genericEventSourceErrorHandler(e, setErr) }

            async function readData(e) {
                if (e.data === "") {
                    return
                }
                let json = JSON.parse(e.data)
                if (json) {
                    dispatchData({
                        type: STATE.UPDATELIST,
                        edgeData: json.variables.edges,
                        queryString: queryString,
                        oldPageInfo: pageInfoRef.current,
                        newPageInfo: json.variables.pageInfo,
                        totalCount: json.variables.totalCount,
                        setPageInfo: setPageInfo
                    })

                    setTotalCount(json.variables.totalCount)
                }
            }

            listener.onmessage = e => readData(e)
            setEventSource(listener)
        } else {
            setEventSource(null)
        }
    }, [stream, apikey, queryString, pathString])


    // Non Stream Data Dispatch Handler
    React.useEffect(() => {
        if (!stream && pathString !== null && !err) {
            setEventSource(null)

            fetch(`${pathString}${queryString}`, {
                headers: apikey === undefined ? {} : { "apikey": apikey }
            }).then((resp)=>{
                resp.json().then((data) =>{
                    dispatchData({ type: STATE.UPDATE, data: data })
                })
            }).catch((e) =>{
                setErr(e.onmessage)
            })
        }
    }, [stream, queryString, pathString, err, apikey])

    // Update PageInfo Ref
    React.useEffect(() => {
        pageInfoRef.current = pageInfo
    }, [pageInfo])


    // Reset states when any prop that affects path is changed
    React.useEffect(() => {
        if (stream) {
            setPageInfo(null)
            setTotalCount(null)
            dispatchData({ type: STATE.UPDATE, data: null })
            setPathString(url && namespace ? `${url}namespaces/${namespace}/vars` : null)
        } else {
            dispatchData({ type: STATE.UPDATE, data: null })
            setPathString(url && namespace ? `${url}namespaces/${namespace}/vars` : null)
        }
    }, [stream, namespace, url])



    // OLD

    // getNamespaces returns a list of namespaces
    async function getNamespaceVariables(...queryParameters) {
        // fetch namespace list by default
        let resp = await fetch(`${url}namespaces/${namespace}/vars${ExtractQueryString(false, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            let json = await resp.json()
            return json.variables.edges
        } else {
            throw new Error((await HandleError('list namespace variables', resp, 'namespaceVars')))
        }
    }

    async function getNamespaceVariable(name, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/vars/${name}${ExtractQueryString(false, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            return { data: await resp.text(), contentType: resp.headers.get("Content-Type") }
        } else {
            throw new Error(await HandleError('get variable', resp, 'getNamespaceVariable'))
        }
    }

    async function getNamespaceVariableBuffer(name, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/vars/${name}${ExtractQueryString(false, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            return { data: await resp.arrayBuffer(), contentType: resp.headers.get("Content-Type") }
        } else {
            throw new Error(await HandleError('get variable', resp, 'getNamespaceVariable'))
        }
    }

    async function getNamespaceVariableBlob(name, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/vars/${name}${ExtractQueryString(false, ...queryParameters)}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            return { data: await resp.blob(), contentType: resp.headers.get("Content-Type") }
        } else {
            throw new Error(await HandleError('get variable', resp, 'getNamespaceVariable'))
        }
    }

    async function deleteNamespaceVariable(name, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/vars/${name}${ExtractQueryString(false, ...queryParameters)}`, {
            method: "DELETE",
            headers: apikey === undefined ? {} : { "apikey": apikey }
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
                apikey: apikey === undefined ? null : apikey
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
        getNamespaceVariableBlob,
        deleteNamespaceVariable,
        setNamespaceVariable
    }

}