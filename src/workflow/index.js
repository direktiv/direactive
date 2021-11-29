import * as React from 'react'
import fetch from "cross-fetch"
import { CloseEventSource, HandleError } from '../util'
const {EventSourcePolyfill} = require('event-source-polyfill')

/*
    useWorkflows is a react hook which returns a list of items, createDirectory, createWorkflow, deleteDirectory, deleteWorkflow
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - namespace the namespace to send the requests to
      - path to the workflow you want to change
      - apikey to provide authentication of an apikey
*/
export const useDirektivWorkflow = (url, stream, namespace, path, apikey) => {

    const [data, setData] = React.useState(null)
    const [err, setErr] = React.useState(null)
    const [eventSource, setEventSource] = React.useState(null)

    React.useEffect(()=>{
        if(stream) {
            if (eventSource === null){
                // setup event listener 
                let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/tree/${path}`, {
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
                getWorkflow()
            }
        }
    },[data])

    React.useEffect(()=>{
        return () => CloseEventSource(eventSource)
    },[eventSource])


    async function getWorkflow() {
        try {
            let uri = `${url}namespaces/${namespace}/tree/${path}`
 
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

    async function getRevisions(){
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=refs`,{})
            if(resp.ok) {
                let js = await resp.json()
                return js.edges
            } else {
                setErr(await HandleError('fetch workflow refs', resp, 'getWorkflow'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function updateWorkflow(newwf) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=update-workflow`, {
                method: "post",
                headers: {
                    "Content-type": "text/yaml",
                    "Content-Length": newwf.length,
                },
                body: newwf
            })
            if (!resp.ok) {
                return await HandleError('update workflow', resp, 'updateWorkflow')
            }
        } catch (e) {
            return e.message
        }
    }

    async function toggleWorkflow(active) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=toggle`, {
                method: "POST",
                body: JSON.stringify({
                    live: active
                }),
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (!resp.ok){
                return await HandleError('toggle workflow', resp, 'toggleWorkflow')
            }
        } catch(e) {
           return e.message
        }
    }

    async function getWorkflowRouter() {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=router`, {
                method: "get",
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok) {
                let json = await resp.json()
                return json
            } else {
                setErr(await HandleError('get workflow router', resp, 'getWorkflow'))
            }
        } catch (e) {
            setErr(e.message)
        }
    }

    async function editWorkflowRouter(routes, live) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=edit-router`, {
                method: "POST",
                body: JSON.stringify({
                    route: routes,
                    live: live,
                }),
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (!resp.ok) {
                return await HandleError('edit workflow router', resp, 'editRouter')
            }
        } catch(e) {
            return e.message
        }
    }

    async function setWorkflowLogToEvent(val) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=set-workflow-event-logging`,{
                method: "POST",
                body: JSON.stringify({
                    logger: val
                }),
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (!resp.ok){
                return await HandleError('set log to event', resp, 'getWorkflow')
            }
        } catch(e) {
            return e.message
        }
    }

    async function executeWorkflow(input) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=execute`, {
                method: "POST",
                body: input,
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (resp.ok) {
                let json = await resp.json()
                return json.instance
            } else {
                return await HandleError('execute workflow', resp, 'executeWorkflow')
            }
        } catch(e) {
            return e.message
        }
    }

    async function addAttributes(attributes) {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=create-node-attributes`, {
                method: "PUT",
                body: JSON.stringify({
                    attributes: attributes
                }),
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (!resp.ok){
                return await HandleError('add workflow attributes', resp, 'createAttribute')
            }
        } catch(e){
            return e.message
        }
    }

    async function deleteAttributes(attributes){
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=delete-node-attributes`, {
                method: "DELETE",
                body: JSON.stringify({
                    attributes: attributes
                }),
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (!resp.ok){
                return await HandleError('delete workflow attributes', resp, 'deleteAttribute')
            }
        } catch(e){
            return e.message
        }
    }

    async function getInstancesForWorkflow() {
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/instances?filter.field=AS&filter.type=CONTAINS&filter.val=${path}`,{})
            if (resp.ok) {
                let json = await resp.json()
                return json.instances.edges
            } else {
                setErr(await HandleError('list instances', resp, 'listInstances'))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function getStateMillisecondMetrics(){
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=metrics-state-milliseconds`, {})
            if (resp.ok) {
                let json = await resp.json()
                return json.results
            } else {
                setErr(await HandleError("get state metrics", resp, "getMetrics"))
            }
        } catch(e) {
            setErr(e.message)
        }
    }

    async function saveWorkflow(ref){
        let rev = ref
        if(rev === undefined){
            rev = "latest"
        }
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=save-workflow&ref=${rev}`, {
                method: "POST",
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if (!resp.ok) {
                return await HandleError('save workflow', resp, 'saveWorkflow')
            } else {
                return await resp.json()
            }
        } catch(e) {
            return e.message
        }
    }

    async function deleteRevision(ref) {
        let rev = ref
        if(rev === undefined){
            rev = "latest"
        }
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=delete-revision&ref=${ref}`, {
                method:"POST",
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if(!resp.ok) {
                return await HandleError(`delete revision`, resp, 'deleteRevision')
            }
        } catch(e) {
            return e.message
        }
    }

    async function discardWorkflow(ref) {
        let rev = ref
        if(rev === undefined){
            rev = "latest"
        }
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=discard-workflow&ref=${rev}`, {
                method: "POST",
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if(!resp.ok) {
                return await HandleError('discard workflow', resp, 'discardWorkflow')
            }
        } catch(e) {
            return e.message
        }
    }

    async function tagWorkflow(ref, tag) {
        let rev = ref
        if(rev === undefined){
            rev = "latest"
        }
        try {
            let resp = await fetch(`${url}namespaces/${namespace}/tree/${path}?op=tag&ref=${ref}&tag=${tag}`,{
                method: "POST",
                headers: apikey === undefined ? {}:{"apikey": apikey}
            })
            if(!resp.ok) {
                return await HandleError(`tag workflow`, resp, 'tag')
            }
        } catch(e) {
            return e.message
        }
    }

    return {
        data,
        err,
        getWorkflow,
        setWorkflowLogToEvent,
        toggleWorkflow,
        getWorkflowRouter,
        editWorkflowRouter,
        executeWorkflow,
        updateWorkflow,
        saveWorkflow,
        discardWorkflow,
        tagWorkflow,
        getRevisions,
        deleteRevision,
        addAttributes,
        deleteAttributes,
        getInstancesForWorkflow,
        getStateMillisecondMetrics
    }
}