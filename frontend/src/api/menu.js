import request from './request'

// 获取当前用户的菜单列表
export function getMenus() {
  return request.get('/menus')
}
