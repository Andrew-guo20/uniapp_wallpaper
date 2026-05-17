export function getRelativeTime(timestamp) {
  // 获取当前时间戳
  const now = Date.now();
  // 计算时间差（毫秒）
  const diff = now - timestamp;

  // 定义时间单位（毫秒）
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day; // 简化计算，以30天为一个月

  // 1分钟内
  if (diff < minute) {
    return '1分钟';
  }
  // 1小时内
  else if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes}分钟`;
  }
  // 1天内
  else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}小时`;
  }
  // 1个月内
  else if (diff < month) {
    const days = Math.floor(diff / day);
    return `${days}天`;
  }
  // 3个月内
  else if (diff < 3 * month) {
    const months = Math.floor(diff / month);
    return `${months}月`;
  }
  // 超过3个月
  else {
    return null;
  }
}

export function goToHome() {
  uni.showModal({
    title: '提示',
    content: '页面有误将返回首页',
    showCancel: false,
    success: (res) => {
      if (res.confirm) {
        uni.reLaunch({
          url: '/pages/index/index'
        })
      }
    }
  })
}