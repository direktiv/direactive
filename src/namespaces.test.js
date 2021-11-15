import { useNamespaces } from './namespaces'
import { renderHook, act } from "@testing-library/react-hooks";
import * as matchers from 'jest-extended';
import { Config } from './util';
expect.extend(matchers);

// mock timer using jest
jest.useFakeTimers();

describe('useNamespaces', () => {
  it('fetch namespaces',  async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNamespaces(Config.url, false));
    await waitForNextUpdate()
    expect(result.current.data).toBeArray()
  })
  it('stream namespaces', async() => {
    const { result, waitForNextUpdate } = renderHook(() => useNamespaces(Config.url, true));
    await waitForNextUpdate()
    expect(result.current.data).toBeArray()
  })
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
