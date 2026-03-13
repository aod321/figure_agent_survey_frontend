/*
 * @Author: DaiYu
 * @Date: 2022-07-02 09:43:09
 * @LastEditors: DaiYu
 * @LastEditTime: 2022-11-21 09:21:57
 * @FilePath: \src\api\home.ts
 */

import { defHttp } from '@/utils/http/axios'

/* eslint-disable no-unused-vars */
enum Api {
	SELECTBUSINESS = '/passenger/cityBusiness/selectBusiness',
}
/* eslint-enable no-unused-vars */
/**
 * @description: 可获取 banner( 轮播图 ) 数据
 * @param {number} areaCode 默认为 0
 * @return {*}
 */
export function getSelectBusinessApi(areaCode = 0) {
	return defHttp.post({
		url: Api.SELECTBUSINESS,
		params: { areaCode },
	})
}
