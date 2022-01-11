import * as React from 'react'
import { CloseEventSource, HandleError } from '../util'
const {EventSourcePolyfill} = require('event-source-polyfill')
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

    React.useEffect(()=>{
        if(stream){
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/event-listeners`, {
                    headers: apikey === undefined ? {}:{"apikey": apikey}
                })

                listener.onerror = (e) => {
                    if(e.status === 403) {
                        setErrListeners("permission denied")
                    }
                }

                async function readData(e) {
                    if(e.data === "") {
                        return
                    }
                    let json = JSON.parse(e.data)
                    setEventListeners(json.edges)
                }

                listener.onmessage = e => readData(e)
                setEventListenerSource(listener)
            }
        } else {
            if(eventListeners === null) {
                getEventListeners()
            }
        }
    },[])

    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/events`, {
                    headers: apikey === undefined ? {}:{"apikey": apikey}
                })

                listener.onerror = (e) => {
                    if(e.status === 403) {
                        setErrHistory("permission denied")
                    }
                }

                async function readData(e) {
                    if(e.data === "") {
                        return
                    }
                    let json = JSON.parse(e.data)
                    setEventHistory(json.events.edges)
                }

                listener.onmessage = e => readData(e)
                setEventSource(listener)
            }
        } else {
            if(eventHistory === null) {
                getEventHistory()
            }
        }
    },[eventHistory])

    React.useEffect(()=>{
        return () => CloseEventSource(eventListenerSource)
    },[eventListenerSource])

    React.useEffect(()=>{
        return () => CloseEventSource(eventSource)
    },[eventSource])

    async function getEventListeners(){
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/event-listeners`,{
                method: "GET",
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if(!resp.ok){
                return await HandleError('get event listeners', resp, 'listEventHistory')
            }
        } catch(e){
            return e.message
        }
    }

    async function getEventHistory(){
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/events`,{
                method: "GET",
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if(!resp.ok){
                return await HandleError('get event history', resp, 'listEventHistory')
            }
        } catch(e){
            return e.message
        }
    }

    async function replayEvent(event){
        let headers = {
            "content-type": "application/cloudevents+json; charset=UTF-8"
        }
        if(apikey !== undefined) {
            headers["apikey"] = apikey
        }
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/events/${event}/replay`,{
                method: "POST",
                headers: headers
            })
            if(!resp.ok) {
                return await HandleError('send namespace event', resp, "sendNamespaceEvent")
            }
        } catch(e) {
            return e.message
        }
    }

    async function sendEvent(event){
        let headers = {
            "content-type": "application/cloudevents+json; charset=UTF-8"
        }
        if(apikey !== undefined) {
            headers["apikey"] = apikey
        }
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/broadcast`,{
                method: "POST",
                body: event,
                headers: headers
            })
            if(!resp.ok) {
                return await HandleError('send namespace event', resp, "sendNamespaceEvent")
            }
        } catch(e) {
            return e.message
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
