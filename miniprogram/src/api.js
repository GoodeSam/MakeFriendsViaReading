import Taro from '@tarojs/taro'

const BASE = process.env.NODE_ENV === 'development'
  ? 'http://127.0.0.1:8000/api'
  : 'https://your-api-domain.com/api'

function getToken() {
  try {
    return Taro.getStorageSync('mfvr_token') || ''
  } catch {
    return ''
  }
}

function request(method, path, data) {
  const token = getToken()
  return new Promise((resolve, reject) => {
    Taro.request({
      url: BASE + path,
      method: method.toUpperCase(),
      data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const e = new Error(res.data?.detail || `请求失败 (${res.statusCode})`)
          e.status = res.statusCode
          reject(e)
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络错误，请检查连接'))
      },
    })
  })
}

export const api = {
  sendCode: (phone) => request('POST', '/auth/send-code', { phone }),
  register: (data) => request('POST', '/auth/register', data),
  login: (data) => request('POST', '/auth/login', data),
  me: () => request('GET', '/auth/me'),

  getCommunities: () => request('GET', '/communities'),

  getListings({ type, listingType, sort, allCommunities } = {}) {
    const p = []
    if (type) p.push(`type=${type}`)
    if (listingType) p.push(`listing_type=${listingType}`)
    if (sort) p.push(`sort=${sort}`)
    if (allCommunities) p.push('all_communities=true')
    const qs = p.length ? '?' + p.join('&') : ''
    return request('GET', '/listings' + qs)
  },
  getMyListings: () => request('GET', '/listings/mine'),
  getListing: (id) => request('GET', `/listings/${id}`),
  createListing: (data) => request('POST', '/listings', data),
  lookupBook: (isbn) => request('GET', `/books/by-isbn/${isbn}`),

  createApplication: (data) => request('POST', '/applications', data),
  getApplications: (role) => request('GET', `/applications${role ? '?role=' + role : ''}`),
  acceptApplication: (id) => request('POST', `/applications/${id}/accept`),
  rejectApplication: (id) => request('POST', `/applications/${id}/reject`),
  completeApplication: (id) => request('POST', `/applications/${id}/complete`),

  getMessages: (convId) => request('GET', `/conversations/${convId}/messages`),
  sendMessage: (convId, content) =>
    request('POST', `/conversations/${convId}/messages`, { content }),
}
