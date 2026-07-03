const WALLPAPER_CLOUD_URL = 'https://env-00jy6ar8nt4o.dev-hz.cloudbasefunction.cn/wallpaper'

function callWallpaperMethod(method, data) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${WALLPAPER_CLOUD_URL}/${method}`,
			method: 'POST',
			data: data || {},
			success(res) {
				resolve(res.data)
			},
			fail(err) {
				reject(err)
			}
		})
	})
}

function createWallpaperObject() {
	return new Proxy({}, {
		get(_target, method) {
			if (typeof method !== 'string') return undefined
			return (data) => callWallpaperMethod(method, data)
		}
	})
}

export function installWallpaperCloudAdapter() {
	if (typeof uniCloud === 'undefined' || uniCloud.__wallpaperAdapterInstalled) return

	const originalImportObject = uniCloud.importObject && uniCloud.importObject.bind(uniCloud)
	uniCloud.importObject = function(name, options) {
		if (name === 'wallpaper') return createWallpaperObject()
		if (originalImportObject) return originalImportObject(name, options)
		throw new Error(`uniCloud.importObject is unavailable for ${name}`)
	}
	uniCloud.__wallpaperAdapterInstalled = true
}
