import * as React from 'react'
import { CloseEventSource, HandleError, ExtractQueryString, PageInfoProcessor } from '../util'
const { EventSourcePolyfill } = require('event-source-polyfill')
const fetch = require('isomorphic-fetch')


/*
    useEvents is a react hook which returns details
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - namespace the namespace to send the requests to
      - apikey to provide authentication of an apikey
*/
export const useDirektivEvents = (url, stream, namespace, apikey, queryParameters) => {
    const [eventHistory, setEventHistory] = React.useState(null)
    const [eventListeners, setEventListeners] = React.useState(null)

    const [errHistory, setErrHistory] = React.useState(null)
    const [errListeners, setErrListeners] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)
    const [eventListenerSource, setEventListenerSource] = React.useState(null)

    // Store Query parameters
    const [eventListenersQueryString, setEventListenersQueryString] = React.useState(ExtractQueryString(false, ...(queryParameters && queryParameters.listeners && Array.isArray(queryParameters.listeners)) ? queryParameters.listeners : []))
    const [eventHistoryQueryString, setEventHistoryQueryString] = React.useState(ExtractQueryString(false, ...(queryParameters && queryParameters.history && Array.isArray(queryParameters.history)) ? queryParameters.history : []))


    // Stores PageInfo about event list streams
    const [eventListenersPageInfo, setEventListenersPageInfo] = React.useState(null)
    const [eventHistoryPageInfo, setEventHistorysPageInfo] = React.useState(null)

    const [eventListenersTotalCount, setEventListenersTotalCount] = React.useState(null)
    const [eventHistoryTotalCount, setEventHistorysTotalCount] = React.useState(null)

    React.useEffect(() => {
        if (stream) {
            if (eventListenerSource === null) {
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/event-listeners${eventListenersQueryString}`, {
                    headers: apikey === undefined ? {} : { "apikey": apikey }
                })

                listener.onerror = (e) => {
                    if (e.status === 403) {
                        setErrListeners("permission denied")
                    } else if (e.status === 404) {
                        setErrListeners(e.statusText)
                    }
                }

                async function readData(e) {
                    if (e.data === "") {
                        return
                    }
                    let json = JSON.parse(e.data)
                    let pInfo = PageInfoProcessor(eventListenersPageInfo, json.pageInfo, eventListeners, json.edges, ...(queryParameters && queryParameters.listeners && Array.isArray(queryParameters.listeners)) ? queryParameters.listeners : [])
                    setEventListenersPageInfo(pInfo.pageInfo)
                    setEventListenersTotalCount(json.totalCount)
                    if (pInfo.shouldUpdate) {
                        setEventListeners(json.edges)
                    }
                }

                listener.onmessage = e => readData(e)
                setEventListenerSource(listener)
            }
        } else {
            if (eventListeners === null) {
                getEventListeners()
            }
        }
    }, [stream, eventListenerSource, eventListeners])

    React.useEffect(() => {
        if (stream) {
            if (eventSource === null) {
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/events${eventHistoryQueryString}`, {
                    headers: apikey === undefined ? {} : { "apikey": apikey }
                })

                listener.onerror = (e) => {
                    if (e.status === 403) {
                        setErrHistory("permission denied")
                    } else if (e.status === 404) {
                        setErrHistory(e.statusText)
                      }
                }

                async function readData(e) {
                    if (e.data === "") {
                        return
                    }
                    let json = JSON.parse(e.data)
                    let pInfo = PageInfoProcessor(eventHistoryPageInfo, json.events.pageInfo, eventHistory, json.events.edges, ...(queryParameters && queryParameters.history && Array.isArray(queryParameters.history)) ? queryParameters.history : [])
                    setEventHistorysPageInfo(pInfo.pageInfo)
                    setEventHistorysTotalCount(json.events.totalCount)
                    if (pInfo.shouldUpdate) {
                        setEventHistory(json.events.edges)
                    }
                }

                listener.onmessage = e => readData(e)
                setEventSource(listener)
            }
        } else {
            if (eventHistory === null) {
                getEventHistory()
            }
        }
    }, [stream, eventHistory, eventSource])

    React.useEffect(() => {
        return () => CloseEventSource(eventListenerSource)
    }, [eventListenerSource])

    React.useEffect(() => {
        return () => CloseEventSource(eventSource)
    }, [eventSource])

    React.useEffect(()=>{
        if(stream){
            let newListenerQueryString = ExtractQueryString(false, ...(queryParameters && queryParameters.listeners && Array.isArray(queryParameters.listeners)) ? queryParameters.listeners : [])
            let newHistoryQueryString = ExtractQueryString(false, ...(queryParameters && queryParameters.history && Array.isArray(queryParameters.history)) ? queryParameters.history : [])

            if (newHistoryQueryString !== eventHistoryQueryString) {
                setEventHistoryQueryString(newHistoryQueryString)
                CloseEventSource(eventSource)
                setEventSource(null)
            }

            if (newListenerQueryString !== eventListenersQueryString) {
                setEventListenersQueryString(newListenerQueryString)
                CloseEventSource(eventListenerSource)
                setEventListenerSource(null)
            }
        }
    },[eventSource, eventListenerSource, queryParameters, eventHistoryQueryString, eventListenersQueryString, stream])

    async function getEventListeners(...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/event-listeners${ExtractQueryString(false, ...queryParameters)}`, {
            method: "GET",
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
            throw new Error(await HandleError('get event listeners', resp, 'listEventHistory'))
        }
        return await resp.json()
    }

    async function getEventHistory(...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/events${ExtractQueryString(false, ...queryParameters)}`, {
            method: "GET",
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
            throw new Error(await HandleError('get event history', resp, 'listEventHistory'))
        }
        return await resp.json()
    }

    async function replayEvent(event, ...queryParameters) {
        let headers = {
            "content-type": "application/cloudevents+json; charset=UTF-8"
        }
        if (apikey !== undefined) {
            headers["apikey"] = apikey
        }
        let resp = await fetch(`${url}namespaces/${namespace}/events/${event}/replay${ExtractQueryString(false, ...queryParameters)}`, {
            method: "POST",
            headers: headers
        })
        if (!resp.ok) {
            throw new Error(await HandleError('send namespace event', resp, "sendNamespaceEvent"))
        }
        return
    }

    async function sendEvent(event, ...queryParameters) {
        let headers = {
            "content-type": "application/cloudevents+json; charset=UTF-8"
        }
        if (apikey !== undefined) {
            headers["apikey"] = apikey
        }
        let resp = await fetch(`${url}namespaces/${namespace}/broadcast${ExtractQueryString(false, ...queryParameters)}`, {
            method: "POST",
            body: event,
            headers: headers
        })
        if (!resp.ok) {
            throw new Error(await HandleError('send namespace event', resp, "sendNamespaceEvent"))
        }
    }

    return {
        eventHistory,
        eventListeners,
        errHistory,
        errListeners,
        eventListenersPageInfo,
        eventHistoryPageInfo,
        eventListenersTotalCount,
        eventHistoryTotalCount,
        getEventHistory,
        getEventListeners,
        sendEvent,
        replayEvent
    }
}
