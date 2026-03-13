/*
 * @Author: DaiYu
 * @Date: 2022-07-02 09:43:09
 * @LastEditors: DaiYu
 * @LastEditTime: 2022-10-27 09:33:38
 * @FilePath: \src\api\change-phone.ts
 */

import type { GetSmsCodeParams } from './model/changeModel'
import { encryptByMd5 } from '@/utils/cipher'
import { MD5SING } from '@/utils/config'

/* eslint-disable no-unused-vars */
enum Api {
	CAPTCHA = 'driver/verifyCode/getSmscode',
}
/* eslint-enable no-unused-vars */

/**
 * @description 司机更改手机号获取验证码
 * @param {GetSmsCodeParams} params 请求参数
 */
export function getDriverSms(params: GetSmsCodeParams) {
	const { userPhone, smsType = 32, accountCategory, identifierCode = true } = params
	const signStr = encryptByMd5(`${smsType}&:${userPhone}&:${accountCategory}`) + MD5SING
	return driverHttp.post(
		{
			url: Api.CAPTCHA,
			params: {
				userPhone,
				smsType: 32,
				signStr,
				identifierCode,
				accountCategory,
			},
		},
		{ errorMessageMode: 'none' }, // demo关闭错误信息提示
	)
}
