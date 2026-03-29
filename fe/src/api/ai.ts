// ask ai
import request from './request';
import type { ApiResponse } from './request';

export const askKimi = async function(params:any) {
  return await request.get('/search', params)
}

export const chatKimi = async function(params:any) {
  return await request.get('/chat', params)
}
