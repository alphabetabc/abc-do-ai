# Task · 2026-09-02-072-bigscreen-ui优化

> 状态：✅ 完成
> 类型：编码
> 创建：2026-09-02
> 前置：无
> 关联依据：待补充

---

## 0. 任务信息

| 项        | 值                              |
| --------- | ------------------------------- |
| 编号-slug | 2026-09-02-072-bigscreen-ui优化 |
| 任务类型  | 编码                            |
| 影响范围  | 待补充                          |
| 验收标准  | 待补充                          |

---

## 1. 步骤（用户 review 后 AI 执行）

> 每步明确「做什么 / 输出什么 / 是否需要停下来」。需要用户介入的步骤标 `🛑 等待用户`。

### 步骤 1：电流背景沿 X 轴无限滚动 ✅

- **背景**：`frontend/src/pages/visual/big-screen/components/background/index.tsx` L18-L32 的子 div 是电流背景（`background-animate-1.png`，452×26，绝对定位于 top:1050 / left:729），目前是静态的。
- **动作**：让该电流背景沿 X 轴无限滚动（如 CSS `animation` 平移 `background-position-x`，循环无缝滚动）。
- **输出**：修改 `frontend/src/pages/visual/big-screen/components/background/index.tsx` + `index.css`
- **🛑 等待用户**：否
- **完成**：2026-09-02 已实现。最终动画方案（`.background-flow-animate-current`，双动画叠加 + mask）：

    `frontend/src/pages/visual/big-screen/components/background/index.css`：

    ```css
    /* 电流亮度沿线传播：mask 高亮段从左到右跑 */
    @keyframes background-current-flow {
        0% {
            -webkit-mask-position-x: 0;
            mask-position-x: 0;
        }
        100% {
            -webkit-mask-position-x: 452px;
            mask-position-x: 452px;
        }
    }

    /* 贴图本体沿 X 轴滚动（与 mask 传播叠加） */
    @keyframes background-current-scroll {
        from {
            background-position-x: 0;
        }
        to {
            /* 452px = 电流贴图宽度，平移一个贴图宽度实现无缝循环 */
            background-position-x: 452px;
        }
    }

    .background-flow-animate-current {
        /* 渐变 mask：亮段随动画向右传播，其余半透明保持底色 */
        -webkit-mask-image: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.45) 0%,
            rgba(0, 0, 0, 0.45) 20%,
            #000 38%,
            #fff 50%,
            #000 62%,
            rgba(0, 0, 0, 0.45) 80%,
            rgba(0, 0, 0, 0.45) 100%
        );
        -webkit-mask-size: 452px 100%;
        -webkit-mask-repeat: repeat-x;
        mask-image: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.45) 0%,
            rgba(0, 0, 0, 0.45) 20%,
            #000 38%,
            #fff 50%,
            #000 62%,
            rgba(0, 0, 0, 0.45) 80%,
            rgba(0, 0, 0, 0.45) 100%
        );
        mask-size: 452px 100%;
        mask-repeat: repeat-x;
        animation:
            background-current-scroll 9s linear infinite,
            background-current-flow 2s linear infinite;
        filter: drop-shadow(0 0 6px rgba(96, 195, 255, 0.6));
    }
    ```

    `frontend/src/pages/visual/big-screen/components/background/index.tsx`（电流 div）：

    ```tsx
    <div
        className="background-flow-animate-current"
        style={{
            position: "absolute",
            width: 452,
            height: 26,
            top: 1050,
            left: 729,
            backgroundImage: `url(${resolvePublicAssetUrl("/static/images/background-animate-1.png")})`,
            backgroundSize: "auto 100%",
            backgroundRepeat: "repeat-x",
            pointerEvents: "none",
            zIndex: 0,
            userSelect: "none",
        }}
    />
    ```

    - 要点：贴图慢滚动（9s）+ mask 亮段快传播（2s）双层叠加，形成"电流奔流"；辉光 drop-shadow 主题蓝
    - 迭代记录：纯平移（传送带感）→ 加 steps 闪烁（突兀）→ 加脉冲带 ::after（不像，已删）→ 最终双层叠加

---

### 步骤 2：全屏按钮移到最左边 ✅

- **背景**：`frontend/src/pages/visual/big-screen/components/header/index.tsx` L134-L138 的 `FullscreenButton` 目前位于 Header 最右侧（时间右侧，hover 显示），需要移到最左边。
- **动作**：将 `FullscreenButton` 移到 Header 行首（最左侧，日期之前），并调整相关 hover 预留区域 / 布局逻辑。
- **输出**：修改 `frontend/src/pages/visual/big-screen/components/header/index.tsx`
- **🛑 等待用户**：否
- **完成**：2026-09-02 已实现（最终落地：`FullscreenButton` 作为 flex 顶层第一个子元素，位于日期组之前、独立摆放；右侧时间组恢复为普通 div，FULLSCREEN_BTN_AREA 预留逻辑已删除）

---

### 步骤 3：（无，用户确认任务到此为止）

---

## 2. 依据（任务来源）

| 来源类型 | 路径   | 引用章节 |
| -------- | ------ | -------- |
| -        | 待补充 | -        |

---

## 3. 状态记录

| 日期       | 变更                                  |
| ---------- | ------------------------------------- |
| 2026-09-02 | task 创建（空任务，等待用户逐步填写） |
| 2026-09-02 | 步骤 1、2 完成并同步真实代码；任务结束，归档至 done/ |
