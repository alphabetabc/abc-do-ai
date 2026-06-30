# 多技术栈对照示例 · 客户运营系统 · Vanilla JS

> 用途：展示"客户运营系统"在 Vanilla JS + HTML 下的标准产出
> 与 Vue / React 版对比：相同场景、相同 skill 规则、最简技术栈
> 证明：pm-agent skill 同样适用"无框架"场景（如纯静态原型 / 早期概念验证）

---

## 技术栈

- **框架**：无（Vanilla JS + ES Modules）
- **构建工具**：Vite 5（仅用于 dev server + mock）
- **路由**：基于 URL hash 的轻量 router
- **状态管理**：原生 `EventTarget` 自定义事件
- **UI 库**：原生 HTML + CSS（无 UI 库）
- **HTTP**：`fetch` API
- **Mock**：Vite 内置 mock middleware

---

## 4 件套产物（1 个页面：客户列表）

### 数据层

**文件**：`mock/customerList.json`（与 Vue / React 版本结构完全一致）

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
// 命名四联动：URL = /customer-list，API = getCustomerList
export async function getCustomerList(params = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`/api/customer-list?${query}`)
  const json = await res.json()
  return json.data
}

export async function searchCustomerByTime({ start, end }) {
  const res = await fetch(`/api/customer-list/search-by-time?start=${start}&end=${end}`)
  const json = await res.json()
  return json.data
}
```

### 视图层

**文件**：`src/views/customer/CustomerList.js`

```javascript
import { getCustomerList } from '../../api/customer.js'

// 4 态
const state = {
  list: [],
  loading: false,
  error: '',
  empty: false
}

function render() {
  const app = document.getElementById('app')
  if (state.error) {
    app.innerHTML = `<div class="error">${state.error} <button onclick="retry()">重试</button></div>`
    return
  }
  if (state.empty) {
    app.innerHTML = `<div class="empty">暂无客户数据</div>`
    return
  }
  app.innerHTML = `
    <table class="customer-list">
      <thead>
        <tr><th>姓名</th><th>手机号</th><th>注册时间</th><th>等级</th></tr>
      </thead>
      <tbody>
        ${state.list.map(c => `
          <tr>
            <td>${c.name}</td>
            <td>${c.phone}</td>
            <td>${new Date(c.registerTime).toLocaleString('zh-CN')}</td>
            <td><span class="tag tag-${c.level}">${c.level}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

function retry() {
  state.error = ''
  load()
}

async function load() {
  state.loading = true
  state.error = ''
  render()
  try {
    const data = await getCustomerList()
    state.list = data.list
    state.empty = data.list.length === 0
  } catch (e) {
    state.error = '加载失败：' + e.message
  } finally {
    state.loading = false
    render()
  }
}

load()
```

### 配置层

**文件**：`src/router/index.js`

```javascript
const routes = {
  '/customer-list': () => import('../views/customer/CustomerList.js')
  // ...
}

export function router() {
  const path = window.location.hash.slice(1) || '/customer-list'
  const view = routes[path]
  if (view) {
    document.getElementById('app').innerHTML = '<div class="loading">加载中...</div>'
    view().then(m => m.default ? m.default() : m())
  } else {
    document.getElementById('app').innerHTML = '<div>404</div>'
  }
}

window.addEventListener('hashchange', router)
window.addEventListener('load', router)
```

---

## 4 态覆盖

| 态 | 实现 |
|----|------|
| loading | `<div class="loading">加载中...</div>` |
| empty | `<div class="empty">暂无客户数据</div>` |
| error | `<div class="error">加载失败 + 重试按钮</div>` |
| success | `<table>` 正常渲染 |

---

## 与 Vue / React 版的对照

| 维度 | Vue 3 | React 18 | Vanilla JS | 差异说明 |
|------|-------|----------|------------|---------|
| 视图文件后缀 | `.vue` | `.tsx` | `.js` + DOM 操作 | 表达方式不同 |
| 状态管理 | `ref` / `reactive` | `useState` | 自定义对象 + `render()` | 无响应式，需手动调 render |
| 4 态实现 | 模板条件渲染 | conditional render | 条件分支 + `innerHTML` | 最朴素 |
| 数据契约 | JSON 同构 | JSON 同构 | JSON 同构 | **完全一致** |
| 命名四联动 | URL ↔ API ↔ 数据 ↔ 视图 | URL ↔ API ↔ 数据 ↔ 视图 | URL ↔ API ↔ 数据 ↔ 视图 | **完全一致** |

**结论**：即使是 Vanilla JS（无框架），pm-agent skill 的核心规则（数据契约、命名四联动、4 态、授权机制）依然完全适用。框架只是"如何写视图"的工具，skill 关注的是"写什么"。
