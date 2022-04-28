import * as React from 'react'
import { HandleError, ExtractQueryString, PageInfoProcessor, SanitizePath, StateReducer, STATE, useEventSourceCleaner, useQueryString, genericEventSourceErrorHandler, CloseEventSource } from '../util'
import { Templates } from './templates'
const { EventSourcePolyfill } = require('event-source-polyfill')
const fetch = require('isomorphic-fetch')

/*
  useNodes is a react hook which returns a list of items, createDirectory, createWorkflow, deleteDirectory, deleteWorkflow
  takes:
    - url to direktiv api http://x/api/
    - stream to use sse or a normal fetch
    - namespace the namespace to send the requests to
    - apikey to provide authentication of an apikey
*/
export const useDirektivNodes = (url, stream, namespace, path, apikey, ...queryParameters) => {
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

    const templates = Templates

    // Stream Event Source Data Dispatch Handler
    React.useEffect(() => {
        const handler = setTimeout(() => {
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
                    if (json?.children) {
                        dispatchData({
                            type: STATE.UPDATELIST,
                            data: json,
                            edgeData: json.children.edges,
                            queryString: queryString,
                            oldPageInfo: pageInfoRef.current,
                            newPageInfo: json.children.pageInfo,
                            setPageInfo: setPageInfo
                        })

                        setTotalCount(json.children.totalCount)
                    } else {
                        dispatchData({
                            type: STATE.UPDATE,
                            data: json
                        })
                    }
                }

                listener.onmessage = e => readData(e)
                setEventSource(listener)
            } else {
                setEventSource(null)
            }
        }, 50);

        return () => {
            clearTimeout(handler);
        };
    }, [stream, queryString, pathString])

    // Non Stream Data Dispatch Handler
    React.useEffect(() => {
        if (!stream && pathString !== null) {
            setEventSource(null)
            getNode().then((data) => {
                if (data?.children) {
                    dispatchData({ type: STATE.UPDATE, data: data.children.edges })
                } else {
                    dispatchData({ type: STATE.UPDATE, data: data })
                }
            })
        }
    }, [stream, queryString, pathString])

    // Update PageInfo Ref
    React.useEffect(() => {
        pageInfoRef.current = pageInfo
    }, [pageInfo])

    // Reset states when any prop that affects path is changed
    React.useEffect(() => {
        if (stream) {
            setPageInfo(null)
            setTotalCount(null)
            setPathString(url && namespace && path ? `${url}namespaces/${namespace}/tree${SanitizePath(path)}` : null)
        } else {
            dispatchData({ type: STATE.UPDATE, data: null })
            setPathString(url && namespace && path ? `${url}namespaces/${namespace}/tree${SanitizePath(path)}` : null)
        }
    }, [stream, path, namespace, url])


    async function getNode() {
        let uri = `${url}namespaces/${namespace}/tree`
        if (path !== "") {
            uri += `${SanitizePath(path)}`
        }
        let resp = await fetch(`${uri}/${queryString}`, {
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            let json = await resp.json()
            if (json.children) {
                let currentData = data

                // Set currentData to null if paths have changed
                if (currentData != null && (!currentData.node || json.node.path !== data.node.path)) {
                    currentData = null
                }

                let pInfo = PageInfoProcessor(pageInfo, json.children.pageInfo, data, json.children.edges, ...queryParameters)
                setPageInfo(pInfo.pageInfo)
                setTotalCount(json.children.totalCount)
            }

            return json
        } else {
            throw new Error(await HandleError('get node', resp, 'listNodes'))
        }
    }

    async function createNode(name, type, yaml, ...queryParameters) {
        let uriPath = `${url}namespaces/${namespace}/tree`
        if (path !== "") {
            uriPath += `${SanitizePath(path)}`
        }
        let request = {
            method: "PUT",
            headers: apikey === undefined ? {} : { "apikey": apikey }
        }

        if (type === "workflow") {
            request.body = yaml
            name += `?op=create-workflow`
        } else {
            name += `?op=create-directory`
        }
        let resp = await fetch(`${uriPath}/${name}${ExtractQueryString(true, ...queryParameters)}`, request)
        if (!resp.ok) {
            throw new Error(await HandleError('create node', resp, 'createNode'))
        }

        return await resp.json()
    }

    // TODO: Migrate to another hook
    async function createMirrorNode(name, mirrorSettings, ...queryParameters) {
        let uriPath = `${url}namespaces/${namespace}/tree`
        if (path !== "") {
            uriPath += `${SanitizePath(path)}`
        }
        let request = {
            method: "PUT",
            body: JSON.stringify(mirrorSettings),
            headers: apikey === undefined ? {} : { "apikey": apikey }
        }

        let resp = await fetch(`${uriPath}/${name}?op=create-directory${ExtractQueryString(true, ...queryParameters)}`, request)
        if (!resp.ok) {
            throw new Error(await HandleError('create node', resp, 'createNode'))
        }

        return await resp.json()
    }

    async function deleteNode(name, recursive, ...queryParameters) {
        let uriPath = `${url}namespaces/${namespace}/tree`
        if (path) {
            uriPath += `${SanitizePath(path)}`
        }
        let resp = await fetch(`${uriPath}/${name}?op=delete-node&recursive=${recursive ? "true" : "false"}${ExtractQueryString(true, ...queryParameters)}`, {
            method: "DELETE",
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
            throw new Error(await HandleError('delete node', resp, 'deleteNode'))
        }
    }

    async function renameNode(fpath, oldname, newname, ...queryParameters) {
        let uriPath = `${url}namespaces/${namespace}/tree`
        if (path) {
            uriPath += `${SanitizePath(fpath)}`
        }
        let resp = await fetch(`${uriPath}${oldname}?op=rename-node${ExtractQueryString(true, ...queryParameters)}`, {
            method: "POST",
            body: JSON.stringify({ new: newname }),
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
            throw new Error(await HandleError('rename node', resp, 'renameNode'))
        }

        return await resp.json()
    }

    async function getWorkflowRouter(workflow, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${workflow}?op=router${ExtractQueryString(true, ...queryParameters)}`, {
            method: "get",
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (resp.ok) {
            let json = await resp.json()
            return json.live
        } else {
            throw new Error(await HandleError('get workflow router', resp, 'getWorkflow'))
        }
    }

    async function toggleWorkflow(workflow, active, ...queryParameters) {
        let resp = await fetch(`${url}namespaces/${namespace}/tree/${workflow}?op=toggle${ExtractQueryString(true, ...queryParameters)}`, {
            method: "POST",
            body: JSON.stringify({
                live: active
            }),
            headers: apikey === undefined ? {} : { "apikey": apikey }
        })
        if (!resp.ok) {
            throw new Error(await HandleError('toggle workflow', resp, 'toggleWorkflow'))
        }

        return await resp.json()
    }

    return {
        data,
        err,
        templates,
        pageInfo,
        totalCount,
        getNode,
        createNode,
        deleteNode,
        renameNode,
        toggleWorkflow,
        getWorkflowRouter,
        createMirrorNode,
    }
}