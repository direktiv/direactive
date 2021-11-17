import { renderHook, act } from "@testing-library/react-hooks";
import * as matchers from 'jest-extended';
import {useInstance, useNodes, useWorkflow, useWorkflowLogs} from './index'
import { Config } from "./util";
expect.extend(matchers);

// mock timer using jest
jest.useFakeTimers();

const wfyaml = `states:
- id: helloworld
  type: noop
  transform:
    result: Hello world!
`

let createWF = async () => {
    console.log('create workflow')
    const { result, waitForNextUpdate} = renderHook(()=> useNodes(Config.url, true, Config.namespace, ""))
    await waitForNextUpdate()
    await act( async()=>{
        await result.current.createNode("/test-workflow-hook-execute", "workflow",  wfyaml)
    })
}

let executeWF = async() => {
    console.log('execute workflow')
    const { result, waitForNextUpdate} = renderHook(()=> useWorkflow(Config.url, true, Config.namespace, "test-workflow-hook-execute"))
    await waitForNextUpdate()
    await act( async()=>{
        process.env.INSTANCE_ID = await result.current.executeWorkflow()
    })
}

beforeAll(async ()=>{
    await createWF()
    await executeWF()
})

describe('useInstance', ()=>{
    it('stream instance details',async()=>{
        const { result, waitForNextUpdate} = renderHook(()=> useInstance(Config.url, true, Config.namespace, process.env.INSTANCE_ID))
        await waitForNextUpdate()
        expect(result.current.data.as).toEqual("test-workflow-hook-execute")
    })
    it('fetch instance details',async()=>{
        const { result, waitForNextUpdate} = renderHook(()=> useInstance(Config.url, false, Config.namespace, process.env.INSTANCE_ID))
        await waitForNextUpdate()
        expect(result.current.data.as).toEqual("test-workflow-hook-execute")
    })
})

afterAll(async ()=>{
    console.log('deleting workflow')
    const { result, waitForNextUpdate} = renderHook(()=> useNodes(Config.url, true, Config.namespace, ""))
    await waitForNextUpdate()
    act( ()=>{
        result.current.deleteNode('test-workflow-hook-execute')
    })
    await waitForNextUpdate()
})

