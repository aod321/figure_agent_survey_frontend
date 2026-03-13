/*
 * @Author: DaiYu
 * @Date: 2022-10-25 10:32:00
 * @LastEditors: DaiYu
 * @LastEditTime: 2022-11-08 08:51:50
 * @FilePath: \src\utils\verify.ts
 */
// 验证手机号
export function verifyPhone(phone: string) {
	return /^1\d{10}$/.test(phone)
}

// 校验车主注册密码
export function verifyPassword(value: string) {
	return /^(?!\d+$)(?![a-z]+$)[0-9A-Z]{6,16}$/i.test(value)
}
// 验证网址
export function verifyUrl(url: string) {
	return /^(?:(?:ht|f)tps?:\/\/)?(?:[^!@#$%^&*?.\s-][^!@#$%^&*?.\s]{0,64}\.)+[a-z]{2,6}\/?/.test(
		url,
	)
}
