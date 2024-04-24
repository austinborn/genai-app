import { useCallback, useState } from 'react'
import axios, { AxiosRequestConfig } from 'axios'
import { BACKEND_URL } from '../config'
import { BaseResponse } from '../types'

const instance = axios.create({ baseURL: BACKEND_URL })

export const usePostBackend = <RequestType, ResponseType extends BaseResponse>(endpoint: string) => {
  const [response, setResponse] = useState<ResponseType | null>(null)
  const [error, setError] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const sendRequest = useCallback(
    async (data?: RequestType, config?: AxiosRequestConfig<RequestType>) => {
      try {
        setLoading(true)
        setError(null)
        const { data: response } = await instance.post(endpoint, data, config)
        setResponse(response)
        if (response.error) setError(response.error)
      } catch (error: any) {
        console.error(error)
        setResponse(null)
        setError(error)
      } finally {
        setLoading(false)
      }
    },
    [endpoint]
  )

  return { sendRequest, response, error, loading }
}

export const useGetBackend = <RequestType, ResponseType>(endpoint: string) => {
  const [response, setResponse] = useState<ResponseType | null>(null)
  const [error, setError] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const sendRequest = useCallback(
    async (config?: AxiosRequestConfig<RequestType>) => {
      try {
        setLoading(true)
        const { data: response } = await instance.get(endpoint, config)
        setResponse(response)
      } catch (error: any) {
        console.error(error)
        setResponse(null)
        setError(error)
      } finally {
        setLoading(false)
      }
    },
    [endpoint]
  )

  return { sendRequest, response, error, loading }
}

export default {
  useGetBackend,
  usePostBackend
}
