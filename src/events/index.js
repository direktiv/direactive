import * as React from 'react'
import { CloseEventSource, HandleError, ExtractQueryString } from '../util'
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
export const useDirektivEvents = (url, stream, namespace, apikey) => {
    const [eventHistory, setEventHistory] = React.useState(null)
    const [eventListeners, setEventListeners] = React.useState(null)

    const [errHistory, setErrHistory] = React.useState(null)
    const [errListeners, setErrListeners] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)
    const [eventListenerSource, setEventListenerSource] = React.useState(null)

    React.useEffect(() => {
        if (stream) {
            if (eventSource === null) {
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/event-listeners`, {
                    headers: apikey === undefined ? {} : { "apikey": apikey }
                })

                listener.onerror = (e) => {
                    if (e.status === 403) {
                        setErrListeners("permission denied")
                    }
                }

                async function readData(e) {
                    if (e.data === "") {
                        return
                    }
                    let json = JSON.parse(e.data)
                    setEventListeners(json.edges)
                }

                listener.onmessage = e => readData(e)
                setEventListenerSource(listener)
            }
        } else {
            if (eventListeners === null) {
                getEventListeners()
            }
        }
    }, [])

    React.useEffect(() => {
        if (stream) {
            if (eventSource === null) {
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/events`, {
                    headers: apikey === undefined ? {} : { "apikey": apikey }
                })

                listener.onerror = (e) => {
                    if (e.status === 403) {
                        setErrHistory("permission denied")
                    }
                }

                async function readData(e) {
                    if (e.data === "") {
                        return
                    }
                    let json = JSON.parse(e.data)
                    setEventHistory(json.events.edges)
                }

                listener.onmessage = e => readData(e)
                setEventSource(listener)
            }
        } else {
            if (eventHistory === null) {
                getEventHistory()
            }
        }
    }, [eventHistory])

    React.useEffect(() => {
        return () => CloseEventSource(eventListenerSource)
    }, [eventListenerSource])

    React.useEffect(() => {
        return () => CloseEventSource(eventSource)
    }, [eventSource])

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
        getEventHistory,
        getEventListeners,
        sendEvent,
        replayEvent
    }
}
