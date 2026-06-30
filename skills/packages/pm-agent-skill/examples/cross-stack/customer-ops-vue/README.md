# 多技术栈对照示例 · 客户运营系统 · Vue 3

> 用途：展示"客户运营系统"在 Vue 3 + Composition API 下的标准产出
> 配套示例：React 18 / Vanilla JS 子目录
> 证明：pm-agent skill 与技术栈无关，同样的规则可适配不同栈

---

## 技术栈

- **框架**：Vue 3.4 + Composition API
- **构建工具**：Vite 5
- **路由**：Vue Router 4
- **状态管理**：Pinia 2
- **UI 库**：Element Plus 2.4
- **HTTP**：axios 1.6
- **Mock**：vite-plugin-mock

---

## 4 件套产物（1 个页面：客户列表）

### 数据层

**文件**：`mock/customerList.json`

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "C001",
        "name": "张三",
        "phone": "138****1234",
        "registerTime": "2026-01-15T10:23:00Z",
        "level": "gold"
      }
    ],
    "total": 128,
    "page": 1,
    "pageSize": 20
  }
}
```

### 接口层

**文件**：`src/api/customer.js`

```javascript
import axios from 'axios'

// 命名四联动：URL = /customer-list，API = getCustomerList
export const getCustomerList = (params) => {
  return axios.get('/api/customer-list', { params })
}

export const searchCustomerByTime = (params) => {
  return axios.get('/api/customer-list/search-by-time', { params })
}
```

### 视图层

**文件**：`src/views/customer/CustomerList.vue`

```vue
<template>
  <div class="customer-list">
    <el-table :data="list" v-loading="loading">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="registerTime" label="注册时间">
        <template #default="{ row }">
          {{ formatDate(row.registerTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="level" label="等级">
        <template #default="{ row }">
          <el-tag :type="levelTagType(row.level)">{{ row.level }}</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <!-- 4 态 -->
    <el-empty v-if="!loading && list.length === 0" description="暂无客户数据" />
    <el-alert v-if="error" :title="error" type="error" show-icon />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCustomerList } from '@/api/customer'

const list = ref([])
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  loading.value = true
  try {
    const res = await getCustomerList()
    list.value = res.data.data.list
  } catch (e) {
    error.value = '加载失败：' + e.message
  } finally {
    loading.value = false
  }
})
</script>
```

### 配置层

**文件**：`src/router/modules/customer.js`

```javascript
export default {
  path: '/customer-list',
  name: 'CustomerList',
  component: () => import('@/views/customer/CustomerList.vue'),
  meta: {
    title: '客户列表',
    icon: 'user',
    permission: 'customer:view'
  }
}
```

---

## 4 态覆盖

| 态 | 实现 |
|----|------|
| loading | `el-table` 的 `v-loading` + 骨架屏 |
| empty | `el-empty` 组件 |
| error | `el-alert` 错误提示 + 重试按钮 |
| success | `el-table` 正常渲染 |

---

## 命名映射

| URL | API | 数据文件 | 视图文件 |
|-----|-----|---------|---------|
| `/customer-list` | `getCustomerList` | `customerList.json` | `CustomerList.vue` |
| `/customer-detail/:id` | `getCustomerDetail` | `customerDetail.json` | `CustomerDetail.vue` |

---

## 反模式触发检查

- ✅ 数据 vs UI 分离：list / loading / error 状态标注清晰
- ✅ 不可序列化字段：registerTime 用 ISO 字符串而非 Date 对象
- ✅ 命名四联动：URL ↔ API ↔ 数据 ↔ 视图一致
- ✅ 4 态齐全：loading / empty / error / success 都有
- ✅ 防御前置：mock 数据先于视图开发
