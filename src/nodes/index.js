import * as React from 'react'
import { CloseEventSource, HandleError, ExtractQueryString, PageInfoProcessor } from '../util'
const { EventSourcePolyfill } = require('event-source-polyfill')
const fetch = require('isomorphic-fetch')


export const noop = {name: "noop", data: `description: A simple 'no-op' state that returns 'Hello world!'
states:
- id: helloworld
  type: noop
  transform:
    result: Hello world!
`}

export const action = {name: "action", data: `description: A simple 'action' state that sends a get request
functions:
- id: get
  image: direktiv/request:v1
  type: reusable
states:
- id: getter 
  type: action
  action:
    function: get
    input: 
      method: "GET"
      url: "https://jsonplaceholder.typicode.com/todos/1"
`}

export const consumeEvent = {name: "consumeEvent", data: `functions:
- id: greeter
  image: direktiv/greeting:v1
  type: reusable
description: A simple 'consumeEvent' state that listens for the greetingcloudevent generated from the template 'generate-event'.
states:
- id: ce
  type: consumeEvent
  event:
    type: greetingcloudevent
  timeout: PT1H
  transition: greet
- id: greet
  type: action
  action:
    function: greeter
    input: jq(.greetingcloudevent.data)
  transform:
    greeting: jq(.return.greeting)
`}

export const delay = {name: "delay", data: `description: A simple 'delay' state that waits for 5 seconds
states:
- id: delay
  type: delay
  duration: PT5S
`}

export const error = {name: "error", data: `description: A simple 'error' state workflow that checks an email attempts to validate it.
states:
- id: data
  type: noop
  transform: 
    email: "trent.hilliamdirektiv.io"
  transition: validate-email
- id: validate-email
  type: validate
  subject: jq(.)
  schema:
    type: object
    properties:
      email:
        type: string
        format: email
  catch:
  - error: direktiv.schema.*
    transition: email-not-valid 
  transition: email-valid
- id: email-not-valid
  type: error
  error: direktiv.schema.*
  message: "email '.email' is not valid"
- id: email-valid
  type: noop
  transform: 
    result: "Email is valid."
`}

export const foreach = {name: "foreach", data: `description: A simple 'foreach' state that solves expressions
functions: 
- id: solve
  image: direktiv/solve:v1
  type: reusable
states:
- id: data
  type: noop
  transform: 
    expressions: ["4+10", "15-14", "100*3","200/2"] 
  transition: solve
- id: solve
  type: foreach
  array: 'jq([.expressions[] | {expression: .}])'
  action:
    function: solve
    input:
      x: jq(.expression)
  transform:
    solved: jq(.return)
`}

export const generateEvent = {name: "generateEvent", data: `description: A simple 'generateEvent' state that sends data to a greeting listener.
states:
- id: generate
  type: generateEvent
  event:
    type: greetingcloudevent
    source: Direktiv
    data: 
      name: "Trent"
`}

export const generateSolveEvent = {name: "generateSolveEvent", data: `description: A simple 'generateEvent' state that sends an expression to a solve listener.
states:
- id: generate
  type: generateEvent
  event:
    type: solveexpressioncloudevent
    source: Direktiv
    data: 
      x: "10+5"
`}

export const getAndSet = {name: "getAndSet", data: `description: "Simple Counter getter and setter variable example"
states:
  - id: counter-get
    type: getter 
    transition: counter-set
    variables:
    - key: ExampleVariableCounter
      scope: workflow
    transform: 'jq(. += {"newCounter": (.var.ExampleVariableCounter + 1)})'
  - id: counter-set
    type: setter
    variables:
      - key: ExampleVariableCounter
        scope: workflow 
        value: 'jq(.newCounter)'
`}

export const parallel = {name: "parallel", data: `description: A simple 'parallel' state workflow that runs solve container to solve expressions.
functions: 
- id: solve
  image: direktiv/solve:v1
  type: reusable
states:
- id: run
  type: parallel
  actions:
  - function: solve
    input: 
      x: "10*2"
  - function: solve
    input:
      x: "10%2"
  - function: solve
    input:
      x: "10-2"
  - function: solve
    input:
      x: "10+2"
  # Mode 'and' waits for all actions to be completed
  # Mode 'or' waits for the first action to be completed
  mode: and
`}

export const validate = {name: "validate", data: `description: A simple 'validate' state workflow that checks an email
states:
- id: data
  type: noop
  transform:
    email: "trent.hilliam@direktiv.io"
  transition: validate-email
- id: validate-email
  type: validate
  subject: jq(.)
  schema:
    type: object
    properties:
      email:
        type: string
        format: email
  catch:
  - error: direktiv.schema.*
    transition: email-not-valid 
  transition: email-valid
- id: email-not-valid
  type: noop
  transform:
    result: "Email is not valid."
- id: email-valid
  type: noop
  transform:
    result: "Email is valid."
`}

export const switchState = {name: "switch", data: `description: A simple 'switch' state that checks whether the age provided is older than 18.
states:
- id: data
  type: noop
  transform:
    age: 27
  transition: check
- id: check
  type: switch
  conditions:
  - condition: 'jq(.age > 18)'
    transition: olderthan18
  defaultTransition: youngerthan18
- id: olderthan18
  type: noop
  transform: 
    result: "You are older than 18."
- id: youngerthan18
  type: noop
  transform: 
    result: "You are younger than 18."
`}

export const eventXor = {name: "eventXor", data: `functions:
- id: greeter
  image: direktiv/greeting:v1
  type: reusable
- id: solve2
  image: direktiv/solve:v1
  type: reusable
description: A simple 'eventXor' that waits for events to be received.
states:
- id: event-xor
  type: eventXor
  timeout: PT1H
  events:
  - event: 
      type: solveexpressioncloudevent
    transition: solve
  - event: 
      type: greetingcloudevent
    transition: greet
- id: greet
  type: action
  action:
    function: greeter
    input: jq(.greetingcloudevent.data)
  transform: 
    greeting: jq(.return.greeting)
- id: solve
  type: action
  action:
    function: solve2
    input: jq(.solveexpressioncloudevent.data)
  transform: 
    solvedexpression: jq(.return)
`}

export const eventAnd = {name: "eventAnd", data: `functions:
- id: greeter
  image: direktiv/greeting:v1
  type: reusable
- id: solve
  image: direktiv/solve:v1
  type: reusable
description: A simple 'eventAnd' that waits for events to be received.
states:
- id: event-and
  type: eventAnd
  timeout: PT1H
  events:
  - type: greetingcloudevent
  - type: solveexpressioncloudevent
  transition: greet
- id: greet
  type: action
  action:
    function: greeter
    input: jq(.greetingcloudevent.data)
  transform: 
    greeting: jq(.return.greeting)
    ceevent: jq(.solveexpressioncloudevent)
  transition: solve
- id: solve
  type: action
  action:
    function: solve
    input: jq(.ceevent.data)
  transform: 
    msggreeting: jq(.greeting)
    solvedexpression: jq(.return)
`}
/*
    useNodes is a react hook which returns a list of items, createDirectory, createWorkflow, deleteDirectory, deleteWorkflow
    takes:
      - url to direktiv api http://x/api/
      - stream to use sse or a normal fetch
      - namespace the namespace to send the requests to
      - apikey to provide authentication of an apikey
*/
export const useDirektivNodes = (url, stream, namespace, path, apikey, ...queryParameters) => {
  const [data, setData] = React.useState(null)
  const [err, setErr] = React.useState(null)
  const [load, setLoad] = React.useState(true)
  const [eventSource, setEventSource] = React.useState(null)
  const templates = {
    noop,
    action,
    consumeEvent,
    delay,
    error,
    foreach,
    generateEvent,
    generateSolveEvent,
    getAndSet,
    parallel,
    validate,
    switchState,
    eventXor,
    eventAnd,
  }

  // Store Query parameters
  const [queryString, setQueryString] = React.useState(ExtractQueryString(false, ...queryParameters))

  // Stores PageInfo about node list stream
  const [pageInfo, setPageInfo] = React.useState(null)
  const [totalCount, setTotalCount] = React.useState(null)

  React.useEffect(() => {
    if (stream) {
      if (eventSource === null) {
        // setup event listener 
        let listener = new EventSourcePolyfill(`${url}namespaces/${namespace}/tree${path}${queryString}`, {
          headers: apikey === undefined ? {} : { "apikey": apikey }
        })

        listener.onerror = (e) => {
          if (e.status === 404) {
            setErr(e.statusText)
          } else if (e.status === 403) {
            setErr("permission denied")
          }
        }

        async function readData(e) {
          if (e.data === "") {
            return
          }
          let json = JSON.parse(e.data)
          if (json.children) {
            let currentData = data

            // Set currentData to null if paths have changed
            if (currentData != null && (!currentData.node || json.node.path !== data.node.path)) {
              currentData = null
            }

            let pInfo = PageInfoProcessor(pageInfo, json.children.pageInfo, currentData, json.children.edges, ...queryParameters)
            setPageInfo(pInfo.pageInfo)
            setTotalCount(json.children.totalCount)
            if (pInfo.shouldUpdate) {
              setData(json)
            }
          } else {
            setData(json)
          }
        }

        listener.onmessage = e => readData(e)
        setEventSource(listener)
        setLoad(false)
      }
    } else {
      if (data === null) {
        getNode(...queryParameters)
      }
    }
  }, [data, eventSource, queryString])

  // If queryParameters change and streaming: update queryString, and reset sse connection
  React.useEffect(() => {
    if (stream) {
      let newQueryString = ExtractQueryString(false, ...queryParameters)
      if (newQueryString !== queryString) {
        setQueryString(newQueryString)
        CloseEventSource(eventSource)
        setEventSource(null)
      }
    }
  }, [eventSource, queryParameters, queryString, stream])

    // If namespace or path changes and streaming: reset sse connection
    React.useEffect(() => {
      if (stream) {
        setEventSource(null)
      }
    }, [path, namespace])

  React.useEffect(() => {
    return () => CloseEventSource(eventSource)
  }, [eventSource])

  async function getNode(...queryParameters) {
    let uri = `${url}namespaces/${namespace}/tree`
    if (path !== "") {
      uri += `${sanitizePath(path)}`
    }
    let resp = await fetch(`${uri}/${ExtractQueryString(false, ...queryParameters)}`, {
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
        if (pInfo.shouldUpdate) {
          setData(json)
        }
      } else {
        setData(json)
      }
      return json
    } else {
      throw new Error(await HandleError('get node', resp, 'listNodes'))
    }
  }

  async function createNode(name, type, yaml, ...queryParameters) {
    let uriPath = `${url}namespaces/${namespace}/tree`
    if (path !== "") {
      uriPath += `${sanitizePath(path)}`
    }
    let body = {
      type: type
    }
    if (type === "workflow") {
      body = yaml
      name += `?op=create-workflow`
    } else {
      name += `?op=create-directory`
      body = JSON.stringify(body)
    }
    let resp = await fetch(`${uriPath}/${name}${ExtractQueryString(true, ...queryParameters)}`, {
      method: "PUT",
      body: body,
      headers: apikey === undefined ? {} : { "apikey": apikey }
    })
    if (!resp.ok) {
      throw new Error(await HandleError('create node', resp, 'createNode'))
    }

    return await resp.json()
  }

  async function deleteNode(name, ...queryParameters) {
    let uriPath = `${url}namespaces/${namespace}/tree`
    if (path) {
      uriPath += `${sanitizePath(path)}`
    }
    let resp = await fetch(`${uriPath}/${name}?op=delete-node${ExtractQueryString(true, ...queryParameters)}`, {
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
      uriPath += `${sanitizePath(fpath)}`
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

  function sanitizePath(path) {
    if (path === "/") {
      return ""
    }

    if (path.startsWith("/")) {
      return path
    }

    return "/" + path
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
  }
}