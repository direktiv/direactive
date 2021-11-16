import { renderHook, act } from "@testing-library/react-hooks";
import * as matchers from 'jest-extended';
import { Config } from './util';
import { useSecrets } from './secrets';
expect.extend(matchers);

// mock timer using jest
jest.useFakeTimers();

describe('useSecrets', () => {
    it('list secrets',  async () => {
        const { result, waitForNextUpdate } = renderHook(() => useSecrets(Config.url, Config.namespace));
        await waitForNextUpdate()
        expect(result.current.data).toBeArray()
    })
    it('create and delete secret', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useSecrets(Config.url, Config.namespace));
        await waitForNextUpdate()
        expect(result.current.data).toBeArray()

        await act(async()=>{
            await result.current.createSecret(Config.secret, Config.secretdata)
            result.current.getSecrets()
        })

        await waitForNextUpdate()
        let found = false
        for(var i=0; i < result.current.data.length; i++) {
            if(result.current.data[i].node.name === Config.secret) {
                found = true
            }
        }
        expect(found).toBeTrue()


        await act(async()=>{
           await result.current.deleteSecret(Config.secret)
           result.current.getSecrets()
        })

        await waitForNextUpdate()
        
        found = false
        for(var i=0; i < result.current.data.length; i++) {
            if(result.current.data[i].name === Config.secret) {
                found = true
            }
        }
        expect(found).toBeFalse()
    })
    it('create dumb secret', async()=>{
        const { result, waitForNextUpdate } = renderHook(() => useSecrets(Config.url, Config.namespace));
        await waitForNextUpdate()
        await act(async()=>{
            await result.current.createSecret("not a url", "us e r:tes t")
        })
        expect(result.current.err).not.toBeNull()
    })
    it('delete secret that doesnt exist', async()=>{
        const { result, waitForNextUpdate } = renderHook(() => useSecrets(Config.url, Config.namespace));
        await waitForNextUpdate()
        await act(async()=>{
            await result.current.deleteSecret('test')
        })
        expect(result.current.err).not.toBeNull()
    })
})