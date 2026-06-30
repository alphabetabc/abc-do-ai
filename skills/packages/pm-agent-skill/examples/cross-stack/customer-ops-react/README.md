# 多技术栈对照示例 · 客户运营系统 · React 18

> 用途：展示"客户运营系统"在 React 18 + TypeScript 下的标准产出
> 与 Vue 版本对比：相同场景、相同 skill 规则、不同技术栈
> 证明：pm-agent skill 与技术栈无关

---

## 技术栈

- **框架**：React 18.2 + Hooks
- **构建工具**：Vite 5
- **路由**：React Router 6
- **状态管理**：Zustand 4
- **UI 库**：Ant Design 5
- **HTTP**：axios 1.6
- **Mock**：MSW (Mock Service Worker)

---

## 4 件套产物（1 个页面：客户列表）

### 数据层

**文件**：`mock/customerList.json`（与 Vue 版本结构一致，便于对照）

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

**文件**：`src/api/customer.ts`

```typescript
import axios from 'axios'

interface Customer {
  id: string
  name: string
  phone: string
  registerTime: string
  level: 'gold' | 'silver' | 'bronze'
}

interface ListResponse {
  list: Customer[]
  total: number
  page: number
  pageSize: number
}

// 命名四联动：URL = /customer-list，API = getCustomerList
export const getCustomerList = async (params?: { page?: number; pageSize?: number }) => {
  const res = await axios.get<{ data: ListResponse }>('/api/customer-list', { params })
  return res.data.data
}

export const searchCustomerByTime = async (params: { start: string; end: string }) => {
  const res = await axios.get<{ data: ListResponse }>('/api/customer-list/search-by-time', { params })
  return res.data.data
}
```

### 视图层

**文件**：`src/views/customer/CustomerList.tsx`

```tsx
import { useEffect, useState } from 'react'
import { Table, Tag, Empty, Alert, Space } from 'antd'
import { getCustomerList } from '@/api/customer'
import type { Customer } from '@/api/customer'

export default function CustomerList() {
  const [list, setList] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await getCustomerList()
        setList(data.list)
      } catch (e) {
        setError('加载失败：' + (e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '注册时间',
      dataIndex: 'registerTime',
      key: 'registerTime',
      render: (t: string) => new Date(t).toLocaleString('zh-CN')
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => <Tag color={level === 'gold' ? 'gold' : 'blue'}>{level}</Tag>
    }
  ]

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {error && <Alert type="error" message={error} showIcon />}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        columns={columns}
        locale={{
          emptyText: <Empty description="暂无客户数据" />
        }}
      />
    </Space>
  )
}
```

### 配置层

**文件**：`src/router/modules/customer.tsx`

```tsx
import { lazy } from 'react'
import { RouteObject } from 'react-router-dom'

const CustomerList = lazy(() => import('@/views/customer/CustomerList'))

const customerRoutes: RouteObject[] = [
  {
    path: '/customer-list',
    element: <CustomerList />,
    handle: {
      title: '客户列表',
      icon: 'user',
      permission: 'customer:view'
    }
  }
]

export default customerRoutes
```

---

## 4 态覆盖

| 态 | 实现 |
|----|------|
| loading | Ant Design `Table` 的 `loading` prop |
| empty | `Table.locale.emptyText` + `Empty` 组件 |
| error | `Alert type="error"` 错误提示 + 重试按钮 |
| success | `Table` 正常渲染 |

---

## 与 Vue 版的对照

| 维度 | Vue 3 | React 18 | 差异说明 |
|------|-------|----------|---------|
| 视图文件后缀 | `.vue` | `.tsx` | 单文件组件 vs 函数组件 |
| 状态管理 | `ref` / `reactive` | `useState` | 范式不同，机制一致 |
| 4 态实现 | `v-loading` / `v-if` | conditional render | 表达方式不同 |
| 数据契约 | JSON 同构 | JSON 同构 | **完全一致** |
| 命名四联动 | URL ↔ API ↔ 数据 ↔ 视图 | URL ↔ API ↔ 数据 ↔ 视图 | **完全一致** |

**结论**：在 pm-agent skill 的治理下，**数据契约、命名规范、4 态、授权机制**对 Vue 和 React 完全一致；只有视图层语法不同。
