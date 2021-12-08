import * as React from 'react'
import { CloseEventSource, HandleError } from '../util'
const {EventSourcePolyfill} = require('event-source-polyfill')
const fetch = require('isomorphic-fetch')

/*
    useInstanceLogs is a react hook which returns details for an instance
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - namespace the namespace to send the requests to
      - instance the id used for the instance
      - apikey to provide authentication of an apikey
*/
export const useDirektivInstanceLogs = (url, stream, namespace, instance, apikey) => {
    const [data, setData] = React.useState(null)
    const logsRef = React.useRef([])

    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    React.useEffect(()=>{
        if(stream) {
            let log = logsRef.current
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/instances/${instance}/logs`, {
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
                    for(let i=0; i < json.edges.length; i++) {
                        log.push(json.edges[i])
                    }
                    logsRef.current = log
                    setData(JSON.parse(JSON.stringify(logsRef.current)))
                }

                listener.onmessage = e => readData(e)
                setEventSource(listener)
            }
        } else {
            if(data === null) {
                getInstanceLogs()
            }
        }
    },[data])

    React.useEffect(()=>{
        return () => CloseEventSource(eventSource)
    },[eventSource])

    // getInstanceLogs returns a list of logs
    async function getInstanceLogs() {
        try {
            // fetch instance list by default
            let resp = await fetch(`${url}namespaces/${namespace}/instances/${instance}/logs`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok){
                let json = await resp.json()
                setData(json.edges)
            } else {
                setErr(await HandleError('get instance logs', resp, "instanceLogs"))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    return {
        data,
        err,
        getInstanceLogs
    }
}
/*
    useInstance is a react hook which returns details for an instance
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - namespace the namespace to send the requests to
      - instance the id used for the instance
      - apikey to provide authentication of an apikey
*/
export const useDirektivInstance = (url, stream, namespace, instance, apikey) => {
    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/instances/${instance}`, {
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
                    json.instance["flow"] = json.flow
                    setData(json.instance)
                }

                listener.onmessage = e => readData(e)
                setEventSource(listener)
            }
        } else {
            if(data === null) {
                getInstance()
            }
        }
    },[data])

    React.useEffect(()=>{
        return () => CloseEventSource(eventSource)
    },[eventSource])

    // getInstance returns a list of instances
    async function getInstance() {
        try {
            // fetch instance list by default
            let resp = await fetch(`${url}namespaces/${namespace}/instances/${instance}`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok){
                let json = await resp.json()
                setData(json.instance)
            } else {
                return await HandleError('get instance', resp, "getInstance")
            }
        } catch(e) {
            return e.message
        }
    }

    async function getInput() {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/instances/${instance}/input`, {
                method:"GET"
            })
            if(resp.ok) {
                let json = await resp.json()
                return atob(json.data)
            } else {
                return await HandleError('get instance input', resp, 'getInstance')
            }
        } catch(e) {
            return e.message
        }
    }

    async function getOutput(){
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/instances/${instance}/output`, {
                method:"GET"
            })
            if(resp.ok) {
                let json = await resp.json()
                return atob(json.data)
            } else {
                return await HandleError('get instance output', resp, 'getInstance')
            }
        } catch(e) {
            return e.message
        }
    }

    async function cancelInstance() {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/instances/${instance}/cancel`, {
                method:"POST"
            })
            if(!resp.ok){
                return await HandleError('cancelling instance', resp, "cancelInstance")
            }
        } catch(e) {
            return e.message
        }
    }

    return {
        data,
        err,
        getInstance,
        cancelInstance,
        getInput,
        getOutput
    }
}