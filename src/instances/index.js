import * as React from 'react'
import { CloseEventSource, HandleError, ExtractQueryString, QueryStringsContainsQuery } from '../util'
// For testing
// import fetch from "cross-fetch"
// In Production
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
export const useDirektivInstances = (url, stream, namespace, apikey, ...queryParameters) => {
    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    // Store Query parameters
    const [queryString, setQueryString] = React.useState(ExtractQueryString(false, ...queryParameters))

    // Stores PageInfo about instances list stream
    const [pageInfo, setPageInfo] = React.useState(null)
    const [totalCount , setTotalCount ] = React.useState(null)

    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/instances${queryString}`, {
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

                    let goingBackward = QueryStringsContainsQuery("before", ...queryParameters)

                    if (goingBackward) {
                        console.log("going backwards")
                        if (json.instances.edges.length === 0 && data !== null && pageInfo !== null ) {
                            let piCopy = pageInfo
                            if (!json.instances.pageInfo.hasPreviousPage) {
                                piCopy.hasNextPage = true
                            } else {
                                piCopy.hasNextPage = false
                            }
    
                            piCopy.hasPreviousPage = json.instances.pageInfo.hasPreviousPage
    
                            setPageInfo(piCopy)
    
                            
                            console.log("pageInfo = ", pageInfo)
                            console.log("pageInfo = ", piCopy)
    
                        } else {
                            json.instances.pageInfo.hasNextPage = true
                            console.log("json.instances.pageInfo = ", json.instances.pageInfo)
                            setData(json.instances.edges)
                            setPageInfo(json.instances.pageInfo)
                        }
                    } else {
                        if (json.instances.edges.length === 0 && data !== null && pageInfo !== null ) {
                            let piCopy = pageInfo
                            if (!json.instances.pageInfo.hasNextPage) {
                                piCopy.hasPreviousPage = true
                            } else {
                                piCopy.hasPreviousPage = false
                            }
    
                            piCopy.hasNextPage = json.instances.pageInfo.hasNextPage
    
                            setPageInfo(piCopy)
    
                            
                            console.log("pageInfo = ", pageInfo)
                            console.log("pageInfo = ", piCopy)
    
                        } else {
                            json.instances.pageInfo.hasPreviousPage = true
                            console.log("json.instances.pageInfo = ", json.instances.pageInfo)
                            setData(json.instances.edges)
                            setPageInfo(json.instances.pageInfo)
                        }
                    }



                    setTotalCount(json.instances.totalCount)
                }
                listener.onmessage = e => readData(e)
                setEventSource(listener)
                // setLoad(true)
            }
        } else {
            if(data === null) {
                getInstances()
            }
        }
    },[data, eventSource, queryParameters, pageInfo])

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

    React.useEffect(()=>{
        return () => CloseEventSource(eventSource)
    },[eventSource])

    // getInstances returns a list of instances
    async function getInstances(...queryParameters) {
            // fetch instance list by default
            let resp = await fetch(`${url}namespaces/${namespace}/instances${ExtractQueryString(false, ...queryParameters)}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (!resp.ok){
                throw new Error((await HandleError('list instances', resp, "listInstances")))
            }

            let json = await resp.json()
            setData(json.instances.edges)
            setPageInfo(json.instances.pageInfo)
            setTotalCount(json.instances.totalCount)
            return json
    }
    
    return {
        data,
        err,
        pageInfo,
        totalCount,
        getInstances
    }
}