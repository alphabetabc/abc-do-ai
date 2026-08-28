# 002 · 端点开发工作流（业务无关）

> 定位：回答「一个后端端点从无到有，标准动作是什么、顺序是什么、闸门在哪」。
> 技术事实（栈 / 目录 / 请求链路）见 `001-tech-map.md`；此处只讲**流程**。
> 流程源头：`docs/workflows/tdd-process.md` + 大屏 workflow 第四步 / §2.5 模块纵向切片（2026-08-27 增补）。

---

## 1. 总流程（7 步）

```
① 契约先行 → ② 实库核实 → ③ SQL 模板 → ④ Service → ⑤ Schema → ⑥ Router → ⑦ 测试与联调
     ▲闸门A                                              ▲闸门B：合同测试绿
```

| 步 | 动作 | 产出 | 关键闸门 |
|----|------|------|---------|
| 1 契约先行 | 在 `docs/design/api-contracts.md` 登记端点：路径、方法、query 参数、响应形状（OpenAPI） | 契约条目 + 编号 | **未登记不得写代码**（前端按此并行开发） |
| 2 实库核实 | 用 information_schema 直查目标表实际字段名/类型/长度，与 `data-models.md` 比对；差异记入 spec §10 并调口径 | 字段清单（以实库为准） | **不臆造字段**——SQL 报错大多源于此 |
| 3 SQL 模板 | 在 `backend/app/repositories/sql/<域>/` 新建 `.sql`；全限定 `schema.table`；参数占位符 | SQL 文件 | 不进 migration；必须参数化 |
| 4 Service | 参数规范化（校验/补齐，非法 → `ValueError`）→ `load_sql()` → `get_db_connection()` 执行 → 行转 dict → 聚合 | service 函数（或 `big_screen/<屏>.py` 内公共函数） | 业务逻辑只活在这一层 |
| 5 Schema | Pydantic Response 模型定义进 `backend/app/schemas/<域>.py` | 响应形状 | 与契约第 1 步的形状一致 |
| 6 Router | `APIRouter` 子路由：`Depends(_auth)` 鉴权、`Query` 声明参数、调 service、`ValueError → HTTPException 400`、包 `ApiResponse` | 可访问端点 | 禁止在 router 写业务 |
| 7 测试 | 合同测试（响应形状）+ 端点测试 + 鉴权测试（401/403），放 `backend/tests/` | pytest 用例 | 合同测试绿才算完成 |

之后：更新契约文档状态 → 联调对数 → （大屏场景）spec acceptance-tests 追加用例。

## 2. 两种推进节奏

### 2.1 M1 竖切 + M2 批量（整屏/整域视角）

- **M1 竖切**：先完整打通 1 个端点（SQL + Service + Router + Schema + 鉴权 + 合同测试），沉淀公共逻辑（参数处理、占比计算等公共 Service）
- **M2 批量**：其余端点复制 M1 模式，只替换 SQL 与聚合

### 2.2 单模块纵向切片（041 起，task-053/054 验证，当前默认）

一个业务模块 = 一个会话 = 一个编码 task，一次贯穿：

```
契约先行（闸门 A）→ 后端切片 → 前端切片 → 联调对数 → 收尾勾选
```

- 后端切片内部仍按 §1 的 3→4→5→6 顺序走完
- 与前端在同一 task 内串行，联调问题当次闭环
- 详见 `design/005-big-screen-workflow.md` §2.5

## 3. 鉴权接线（每个端点的固定动作）

```python
def _big_screen_auth() -> Callable[..., Any]:
    if settings.db_mode == "mock":
        return get_current_user          # mock：仅登录
    return require_menu_key("<菜单 key>")  # real：菜单项粒度，无权限 403
```

- 定义位置：`backend/app/core/menu_access.py`（`require_menu_key`）、`backend/app/core/deps.py`（`get_current_user`）
- 端点签名里用 `_: Any = Depends(_big_screen_auth())` 挂上
- 菜单 key 与 `docs/design/system-overview.md` §2.4 的菜单体系对应

## 4. 错误处理模式（统一形状）

| 场景 | 做法 |
|------|------|
| 参数非法 | Service 抛 `ValueError` → Router 捕获转 `HTTPException 400`（如 `INVALID_ORGAN_ID` 类错误码） |
| 未登录 / 无权限 | 401 / 403 由鉴权依赖直接抛，不走业务代码 |
| 5xx | 契约统一错误体；不吞异常裸返回 |
| 响应 | 成功一律包 `ApiResponse(code, message, data)` |

## 5. 后端硬规则摘录（R 系列，全文见 `design/001-big-screen-dev-guide.md` §硬规则）

| # | 规则 | 一句话 |
|---|------|--------|
| R1 | SQL 双轨制 | 运行时 SELECT 放 `repositories/sql/`，不进 migration |
| R2 | Kingbase Oracle 兼容 | DDL 用 `VARCHAR2`/`NUMBER`/`COMMENT ON`，勿粘 MySQL 语法 |
| R3 | 驱动补丁 | 新入口须先 `patch_psycopg2_server_version_detection()` |
| R4 | 全限定表名 | `schema.table`，不依赖 `search_path` |
| R5 | 端点前缀 | visual 域无 `/v1`：`/api/visual/...` |
| R6 | 菜单级鉴权 | `require_menu_key(...)`，不得绕过 |
| R7 | 大屏只读 | 只消费统计表快照，不写明细库 |
| R12 | 参数化查询 | 禁拼接用户输入；日志不输出密码/连接串 |

通用补充（非 R 系列）：
- **编码前实库核实**：字段以 information_schema 直查结果为准，与文档差异要记录（workflow 第四步规则）
- **公共逻辑下沉 Service**：同一域多个端点共享的参数处理 / 聚合逻辑放公共函数，端点间复制粘贴是坏味道
- **不要在其它项目 venv 里跑 alembic / pytest**：一律 `uv run`

## 6. 自检清单（交付一个端点前过一遍）

- [ ] 契约已登记进 `docs/design/api-contracts.md`（含响应形状）
- [ ] SQL 字段已实库核实，差异已记录
- [ ] SQL 模板参数化 + 全限定表名，放在 `repositories/sql/<域>/`
- [ ] Service 无 Router 逻辑、Router 无业务逻辑
- [ ] 鉴权依赖已挂（mock / real 双模式行为正确）
- [ ] 响应包 `ApiResponse`
- [ ] 合同测试 + 端点测试 + 鉴权测试就位且绿
- [ ] Swagger `/docs` 上手动冒烟通过
