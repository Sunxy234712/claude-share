<template>
  <el-empty :description="`「${title}」功能正在开发中`" :image-size="80">
    <el-button type="primary" @click="$router.push('/dashboard')">返回工作台</el-button>
  </el-empty>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'

const route = useRoute()
const title = computed(() => route.meta?.title || '该功能')
</script>
