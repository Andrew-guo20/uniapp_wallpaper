const BASE_URL = 'https://tea.qingnian8.com/api/bizhi/'

// 对于请求进行封装 统一处理错误码
export function request(config = {}) {
  // 给个默认值
  let { url = '', method = 'GET', data = {}, header = {} } = config
  url = BASE_URL + url
  header['access-key'] = '244576'

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      data,
      header,
      success: res => {
        if (res.data.errCode === 0) {
          resolve(res.data)
        } else if (res.data.errCode === 400) {
          uni.showModal({
            title: '错误提示',
            content: res.data.errMsg,
            showCancel: false
          })
          reject(res.data)
        } else {
          uni.showToast({
            title: res.data.errMsg,
            icon: 'none'
          })
        }
      },
      fail: err => {
        reject(err)
      }
    })
  })
}