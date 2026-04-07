import { defineStore } from 'pinia'
import { getMenus } from '../api/menu'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menuList: [],   // 树形菜单数据
    loading: false,
  }),

  actions: {
    async fetchMenus() {
      this.loading = true
      try {
        const res = await getMenus()
        this.menuList = res.data || []
      } finally {
        this.loading = false
      }
    },

    clearMenus() {
      this.menuList = []
    },
  },
})
