import { defineStore } from 'pinia'
import { useMenuStore } from './menu'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isSupervisor: (state) => state.user?.role === 'supervisor',
  },

  actions: {
    // 登录后保存 token 和用户信息，并拉取菜单
    async setLogin(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      await useMenuStore().fetchMenus()
    },

    // 退出登录，清除状态
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      useMenuStore().clearMenus()
    },
  },
})
