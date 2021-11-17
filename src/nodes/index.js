import * as React from 'react'
import fetch from "cross-fetch"
import { CloseEventSource, HandleError } from '../util'
const {EventSourcePolyfill} = require('event-source-polyfill')

/*
    useNodes is a react hook which returns a list of items, createDirectory, createWorkflow, deleteDirectory, deleteWorkflow
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - namespace the namespace to send the requests to
      - apikey to provide authentication of an apikey
*/
export const useDirektivNodes = (url, stream, namespace, path, apikey) => {
    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/tree${path}`, {
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
                    setData(json)
                }

                listener.onmessage = e => readData(e)
                setEventSource(listener)
            }
        } else {
            if(data === null) {
                getNode()
            }
        }
    },[data])

    React.useEffect(()=>{
        return () => CloseEventSource(eventSource)
    },[eventSource])

    async function getNode() {
        try {
            let uri = `${url}namespaces/${namespace}/tree`
            if(path !== "") {
                uri += `/${path}`
            }
            let resp = await fetch(`${uri}/`, {
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok) {
                let json = await resp.json()
                setData(json)
            } else {
                setErr(await HandleError('get node', resp, 'listNodes'))
            }
        } catch(e){
            setErr(e.message)
        }
    }

    async function createNode(name, type, yaml) {
        try {
            let uriPath = `${url}namespaces/${namespace}/tree`
            if(path !== "") {
                uriPath += `/${path}`
            }
            let body = {
                type: type
            }
            if(type === "workflow") {
                body = yaml
                name += `?op=create-workflow`
            } else {
                name += `?op=create-directory`
                body = JSON.stringify(body)
            }
            let resp = await fetch(`${uriPath}/${name}`, {
                method: "PUT",
                body: body,
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (!resp.ok) {
                setErr(await HandleError('create node', resp, 'createNode'))
            }
        } catch(e){
            setErr(e.message)
        }
    }

    async function deleteNode(name) {
        try {
            let uriPath = `${url}namespaces/${namespace}/tree`
            if(path){
                uriPath += `/${path}`
            }
            let resp = await fetch(`${uriPath}/${name}?op=delete-node`, {
                method: "DELETE",
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if(!resp.ok){
                setErr(await HandleError('delete node', resp, 'deleteNode'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function renameNode(fpath, oldname, newname) {
        try {
            let uriPath = `${url}namespaces/${namespace}/tree`
            if(path) {
                uriPath += `/${fpath}`
            }
            let resp = await fetch(`${uriPath}/${oldname}?op=rename-node`,{
                method: "POST",
                body: JSON.stringify({new: newname}),
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (!resp.ok) {
                setErr(await HandleError('rename node', resp, 'renameNode'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function getWorkflowRouter(workflow) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${workflow}?op=router`, {
                method: "get",
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok) {
                let json = await resp.json()
                return json.live
            } else {
                setErr(await HandleError('get workflow router', resp, 'getWorkflow'))
            }
        } catch (e) {
            setErr(e.message)
        }
    }

    async function toggleWorkflow(workflow, active) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${workflow}?op=toggle`, {
                method: "POST",
                body: JSON.stringify({
                    live: active
                }),
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (!resp.ok){
                setErr(await HandleError('toggle workflow', resp, 'toggleWorkflow'))
            }
        } catch(e) {
           setErr(e.message)
        }
    }

    return {
        data,
        err,
        getNode,
        createNode,
        deleteNode,
        renameNode,
        toggleWorkflow,
        getWorkflowRouter,
    }
}