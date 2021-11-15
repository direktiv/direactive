import { renderHook, act } from "@testing-library/react-hooks";
import * as matchers from 'jest-extended';
import { useInstances } from "./instances";
import { useNamespaces } from "./namespaces"
import { Config } from "./util";
expect.extend(matchers);

// mock timer using jest
jest.useFakeTimers();

describe('useInstances', () => {
    it('create a namespace', async() => {
        const { result, waitForNextUpdate } = renderHook(() => useNamespaces(Config.url, true));
        // wait for initial result    
        await waitForNextUpdate()
    
        // create a namespace
        result.current.createNamespace(Config.namespace)
        await waitForNextUpdate()
        let found = false
        for(var i=0; i < result.current.data.length; i++) {
            if(result.current.data[i].node.name === Config.namespace) {
                found = true
            }
        }
        expect(found).toBeTrue()
    })
    it('fetch instances',  async () => {
        const { result, waitForNextUpdate } = renderHook(() => useInstances(Config.url, false, Config.namespace));
        await waitForNextUpdate()
        expect(result.current.data).toBeArray()
      })
    it('stream instances', async() => {
        const { result, waitForNextUpdate } = renderHook(() => useInstances(Config.url, true, Config.namespace));
        await waitForNextUpdate()
        expect(result.current.data).toBeArray()
    })
    it('delete a namespace', async() => {
        const { result, waitForNextUpdate } = renderHook(() => useNamespaces(Config.url, true));
        // wait for initial result
        await waitForNextUpdate()
        
        // delete a namespace
        result.current.deleteNamespace(Config.namespace)
        await waitForNextUpdate()
        let found = false
        for(var i=0; i < result.current.data.length; i++) {
            if(result.current.data[i].node.name === Config.namespace) {
                found = true
            }
        }
        expect(found).toBeFalse()
      })
})