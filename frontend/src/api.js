const BASE = 'http://localhost:8000/api'

function getToken() {
  return localStorage.getItem('mfvr_token')
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const resp = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }))
    const e = new Error(err.detail || 'Request failed')
    e.status = resp.status
    throw e
  }
  return resp.json()
}

export const api = {
  sendCode: (phone) => request('POST', '/auth/send-code', { phone }),
  register: (data) => request('POST', '/auth/register', data),
  login: (data) => request('POST', '/auth/login', data),
  me: () => request('GET', '/auth/me'),

  getCommunities: () => request('GET', '/communities'),

  getListings: ({ type, listingType, sort, allCommunities } = {}) => {
    const p = new URLSearchParams()
    if (type) p.set('type', type)
    if (listingType) p.set('listing_type', listingType)
    if (sort) p.set('sort', sort)
    if (allCommunities) p.set('all_communities', 'true')
    const qs = p.toString()
    return request('GET', `/listings${qs ? '?' + qs : ''}`)
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
  sendMessage: (convId, content) => request('POST', `/conversations/${convId}/messages`, { content }),
}
