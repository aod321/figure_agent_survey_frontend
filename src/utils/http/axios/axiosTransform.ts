/*
 * @Author: DaiYu
 * @Date: 2022-10-13 17:03:00
 * @LastEditors: DaiYu
 * @LastEditTime: 2022-10-25 11:21:18
 * @FilePath: \src\utils\http\axios\axiosTransform.ts
 */
/**
 * Data processing class, can be configured according to the project
 */
import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { RequestOptions, Result } from '#/axios'

export interface CreateAxiosOptions extends AxiosRequestConfig {
	authenticationScheme?: string
	transform?: AxiosTransform
	requestOptions?: RequestOptions
	desc?: string
}

export abstract class AxiosTransform {
	/**
	 * @description: Process configuration before request
	 * @description: Process configuration before request
	 */
	beforeRequestHook?: (_config: AxiosRequestConfig, _options: RequestOptions) => AxiosRequestConfig

	/**
	 * @description: 处理响应数据
	 */
	transformResponseHook?: (_res: AxiosResponse<Result>, _options: RequestOptions) => any

	/**
	 * @description: 请求失败处理
	 */
	requestCatchHook?: (_e: Error, _options: RequestOptions) => Promise<any>

	/**
	 * @description: 请求之前的拦截器
	 */
	requestInterceptors?: (
		_config: InternalAxiosRequestConfig,
		_options: CreateAxiosOptions,
	) => InternalAxiosRequestConfig

	/**
	 * @description: 请求之后的拦截器
	 */
	responseInterceptors?: (_res: AxiosResponse<any>) => AxiosResponse<any>

	/**
	 * @description: 请求之前的拦截器错误处理
	 */
	requestInterceptorsCatch?: (_error: Error) => void

	/**
	 * @description: 请求之后的拦截器错误处理
	 */
	responseInterceptorsCatch?: (_error: Error) => void
}
