// perf-baseline.js —— 单源重构前性能基线测量脚本
//
// 用法（改用 webpack 编译方式，不能直接粘贴到 Console）：
// 1. 在 src/index.js 顶部添加：import '@Src/../../../.trae/skills/oss-visual-designer-project-context/research/refactor-single-source/perf-baseline.js';
//    （或用相对路径：import '../.trae/skills/oss-visual-designer-project-context/research/refactor-single-source/perf-baseline.js';）
// 2. pnpm start 启动 dev server
// 3. 打开浏览器：http://localhost:3000/designer（或对应路由）
// 4. 在控制台执行：window.runPerfBaseline()
// 5. 等输出 [BASELINE DONE]，把 console 输出复制到
//    .trae/skills/oss-visual-designer-project-context/research/refactor-single-source/baseline-2026-07-27.md
//
// 输出：每个指标的平均值 / P50 / P95 / P99 / 最大值
//
// 修复记录（2026-07-27）：
// - 重大修复：浏览器 Console 直接粘贴无法解析 import 语法 → 改为经 webpack 编译
//   方式（在 index.js 引入本文件，函数挂到 window），由 webpack 解析模块依赖

// ============== 模块依赖（ES module import 必须在顶部）==============
import { buildIndex, mergeByIdIntoTree } from '@Src/designer/renderer/utils';
import store from '@Src/store';
import { updateFieldConfig, setComponents } from '@Src/store/modules/designer-canvas-actions';

// ============== 测试场景数据 ==============

// 生成 N 个组件的测试树（4 种规模）
function genTestComponents(n) {
    const components = [];
    for (let i = 0; i < n; i++) {
        components.push({
            uniqueId: `test_${i}`,
            type: 'field',
            data: {
                config: {
                    left: i * 10,
                    top: i * 5,
                    width: 100,
                    height: 50,
                    title: `组件${i}`,
                },
            },
            children:
                i % 50 === 0 && i > 0
                    ? [
                          {
                              uniqueId: `test_${i}_child_0`,
                              type: 'field',
                              data: { config: { left: 0, top: 0, width: 50, height: 25 } },
                              children: [],
                          },
                      ]
                    : [],
        });
    }
    return components;
}

const TEST_SCENARIOS = {
    empty: [],
    small: genTestComponents(100),
    medium: genTestComponents(220),
    large: genTestComponents(440),
    xlarge: genTestComponents(1000),
};

// ============== 工具函数 ==============

function percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = arr.slice().sort((a, b) => a - b);
    const idx = Math.min(Math.floor((sorted.length - 1) * p), sorted.length - 1);
    return sorted[idx];
}

function summarize(name, samples) {
    if (samples.length === 0) {
        return { name, samples: 0, avg: '0.000', min: '0.000', p50: '0.000', p95: '0.000', p99: '0.000', max: '0.000' };
    }
    const sum = samples.reduce((a, b) => a + b, 0);
    const avg = sum / samples.length;
    const p50 = percentile(samples, 0.5);
    const p95 = percentile(samples, 0.95);
    const p99 = percentile(samples, 0.99);
    const max = Math.max(...samples);
    const min = Math.min(...samples);
    return {
        name,
        samples: samples.length,
        avg: avg.toFixed(3),
        min: min.toFixed(3),
        p50: p50.toFixed(3),
        p95: p95.toFixed(3),
        p99: p99.toFixed(3),
        max: max.toFixed(3),
    };
}

function printReport(report) {
    console.log(
        `[${report.name}] samples=${report.samples}` +
            ` avg=${report.avg}ms` +
            ` min=${report.min}ms` +
            ` p50=${report.p50}ms` +
            ` p95=${report.p95}ms` +
            ` p99=${report.p99}ms` +
            ` max=${report.max}ms`,
    );
}

// 安全获取测试 ID（空数组返回 null，由调用方跳过）
function safeGetTestId(components) {
    return components.length > 0 ? components[0].uniqueId : null;
}

// ============== 测量函数 ==============

const PATHS = {
    utils: () => Promise.resolve({ buildIndex, mergeByIdIntoTree }),
    store: () => Promise.resolve({ store }),
    actions: () => Promise.resolve({ updateFieldConfig, setComponents }),
};

// 测量 buildIndex
async function measureBuildIndex(components, iterations = 100) {
    const { buildIndex } = await PATHS.utils();
    const samples = [];
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        buildIndex(components);
        const end = performance.now();
        samples.push(end - start);
    }
    return samples;
}

// 测量 updateFieldConfig（dispatch 完整链路）
async function measureUpdateFieldConfig(components, iterations = 100) {
    const testId = safeGetTestId(components);
    if (!testId) return []; // 空场景跳过
    const { store } = await PATHS.store();
    const { updateFieldConfig } = await PATHS.actions();
    const samples = [];
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        store.dispatch(updateFieldConfig(testId, { config: { left: i, top: i } }));
        const end = performance.now();
        samples.push(end - start);
    }
    return samples;
}

// 测量 setComponents（dispatch 完整链路 + reducer 内部 mergeByIdIntoTree + buildIndex）
// 修复 bug4：不再手动调用 mergeByIdIntoTree，让 reducer 内部自然完成，避免双倍测量
async function measureSetComponents(components, iterations = 100) {
    const { store } = await PATHS.store();
    const { setComponents } = await PATHS.actions();
    const samples = [];
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        // 直接 dispatch 原始 components，reducer 内部会跑 mergeByIdIntoTree + buildIndex
        store.dispatch(setComponents(components));
        const end = performance.now();
        samples.push(end - start);
    }
    return samples;
}

// 测量 mergeByIdIntoTree（reducer 内部的合并逻辑，单测函数耗时）
async function measureMergeByIdIntoTree(components, iterations = 100) {
    if (components.length === 0) return [];
    const { buildIndex, mergeByIdIntoTree } = await PATHS.utils();
    const samples = [];
    const { byId } = buildIndex(components);
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        mergeByIdIntoTree(components, byId, 'fieldPreserve');
        const end = performance.now();
        samples.push(end - start);
    }
    return samples;
}

// 测量 onResize 真热路径（阶段 3 §1.1 修正后新增）
// 模拟 designer-field/index.tsx L243 onResizeHandle：10Hz throttle × getResizedComponents + dispatch setComponents
async function measureOnResize(components, durationMs = 5000, throttleMs = 100) {
    if (components.length === 0) return [];
    const { store } = await PATHS.store();
    const { setComponents } = await PATHS.actions();
    const samples = [];
    const startTime = performance.now();
    let lastTick = startTime;
    let resizeCount = 0;
    while (performance.now() - startTime < durationMs) {
        const now = performance.now();
        if (now - lastTick >= throttleMs) {
            const tickStart = performance.now();
            // 模拟 onResize 路径：throttle 内 dispatch setComponents（带变更后的 components）
            // 用同一 components + 模拟 width/height 变化
            const resized = components.map((c, idx) => ({
                ...c,
                data: {
                    ...c.data,
                    config: {
                        ...c.data.config,
                        width: (c.data.config.width || 100) + 1,
                        height: (c.data.config.height || 50) + 1,
                    },
                },
            }));
            store.dispatch(setComponents(resized));
            const tickEnd = performance.now();
            samples.push(tickEnd - tickStart);
            resizeCount++;
            lastTick = now;
        }
        // 让出主线程，避免阻塞
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
    console.log(
        `[onResize] 模拟 ${durationMs}ms（throttle ${throttleMs}ms），实际触发 ${resizeCount} 次（预期 ~${Math.floor(durationMs / throttleMs)} 次 = ${(1000 / throttleMs).toFixed(1)}Hz）`,
    );
    return samples;
}

// 测量对齐场景（方案 A：N 次 updateFieldConfig 串行 dispatch）
async function measureAlignSerial(components, N, iterations = 20) {
    if (components.length < N) return [];
    const { store } = await PATHS.store();
    const { updateFieldConfig } = await PATHS.actions();
    const samples = [];
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        for (let j = 0; j < N; j++) {
            store.dispatch(updateFieldConfig(`test_${j}`, { config: { left: j, top: j } }));
        }
        const end = performance.now();
        samples.push(end - start);
    }
    return samples;
}

// 测量对齐场景（方案 B：N 次合并为 1 次 setComponents 批量 dispatch）
// 用于对比：方案 A 不达标时切方案 B 验证可行性
async function measureAlignBatchSetComponents(components, N, iterations = 20) {
    if (components.length < N) return [];
    const { store } = await PATHS.store();
    const { setComponents } = await PATHS.actions();
    const samples = [];
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        // 模拟对齐逻辑：先 shallow copy components，再循环更新 N 个节点的 config
        const next = components.map((c, idx) => {
            if (idx < N) {
                return {
                    ...c,
                    data: {
                        ...c.data,
                        config: { ...c.data.config, left: idx, top: idx },
                    },
                };
            }
            return c;
        });
        store.dispatch(setComponents(next));
        const end = performance.now();
        samples.push(end - start);
    }
    return samples;
}

// 验证 Immer draft 代理引用比较语义（review r2 §2.1 假设 A4 验证）
// 在 produce 回调内对比 draft.byId[id].data 与 components[i].data 严格相等
async function verifyImmerProxyReference() {
    try {
        const { store } = await PATHS.store();
        const { updateFieldConfig } = await PATHS.actions();
        const before = store.getState().designerCanvas;
        if (!before.byId || Object.keys(before.byId).length === 0) {
            return { available: false, reason: '当前 state.byId 为空，无法验证（需要先 setComponents 一次）' };
        }
        const testId = Object.keys(before.byId)[0];
        const oldByIdData = before.byId[testId].data;
        // dispatch 一次 updateFieldConfig（不动 config，只触发 buildIndex 重新生成 byId）
        store.dispatch(updateFieldConfig(testId, { config: before.byId[testId].data.config }));
        const after = store.getState().designerCanvas;
        const newByIdData = after.byId[testId]?.data;
        const sameRef = oldByIdData === newByIdData;
        return {
            available: true,
            testId,
            sameRef,
            verdict: sameRef ? '✅ 引用复用生效（reducer 内部已做 oldById 复用）' : '❌ 引用不复用（未变 data 节点也新建了 byId 条目）',
        };
    } catch (e) {
        return { available: false, reason: `验证失败: ${e.message}` };
    }
}

// ============== 主流程 ==============

// 挂到 window，供 Console 手动调用：window.runPerfBaseline()
window.runPerfBaseline = async () => {
    console.log('=== 性能基线测量开始 ===');
    console.log('浏览器:', navigator.userAgent);
    console.log('CPU 核心:', navigator.hardwareConcurrency);
    console.log('');

    const results = {};

    for (const [scenario, components] of Object.entries(TEST_SCENARIOS)) {
        console.log(`--- 场景: ${scenario} (${components.length} 组件) ---`);
        const n = Math.min(50, Math.max(10, Math.floor(1000 / Math.max(components.length / 10, 1))));

        results[`buildIndex_${scenario}`] = await measureBuildIndex(components, n);
        printReport({ name: `buildIndex_${scenario}`, ...summarize(`buildIndex_${scenario}`, results[`buildIndex_${scenario}`]) });

        if (components.length > 0) {
            results[`mergeByIdIntoTree_${scenario}`] = await measureMergeByIdIntoTree(components, n);
            printReport({
                name: `mergeByIdIntoTree_${scenario}`,
                ...summarize(`mergeByIdIntoTree_${scenario}`, results[`mergeByIdIntoTree_${scenario}`]),
            });

            results[`setComponents_${scenario}`] = await measureSetComponents(components, n);
            printReport({ name: `setComponents_${scenario}`, ...summarize(`setComponents_${scenario}`, results[`setComponents_${scenario}`]) });

            results[`updateFieldConfig_${scenario}`] = await measureUpdateFieldConfig(components, n);
            printReport({
                name: `updateFieldConfig_${scenario}`,
                ...summarize(`updateFieldConfig_${scenario}`, results[`updateFieldConfig_${scenario}`]),
            });
        } else {
            console.log('[skip] 空场景跳过 mergeByIdIntoTree/setComponents/updateFieldConfig 测量');
        }
        console.log('');
    }

    // 全选对齐场景：方案 A（串行 updateFieldConfig）+ 方案 B（批量 setComponents）对比
    console.log('--- 全选对齐场景（仅在 large 场景下测） ---');
    if (TEST_SCENARIOS.large.length >= 440) {
        for (const N of [10, 50, 220, 440]) {
            const serialSamples = await measureAlignSerial(TEST_SCENARIOS.large, N, 20);
            const batchSamples = await measureAlignBatchSetComponents(TEST_SCENARIOS.large, N, 20);

            results[`align_serial_${N}`] = serialSamples;
            printReport({ name: `align_serial_${N}`, ...summarize(`align_serial_${N}`, serialSamples) });

            results[`align_batch_${N}`] = batchSamples;
            printReport({ name: `align_batch_${N}`, ...summarize(`align_batch_${N}`, batchSamples) });
        }
    } else {
        console.log('[skip] large 场景少于 440 组件，跳过对齐场景测量');
    }

    // onResize 真热路径（阶段 3 §1.1 修正后必测）
    console.log('--- onResize 真热路径（10Hz setComponents × 5 秒） ---');
    results.onResize_large = await measureOnResize(TEST_SCENARIOS.large, 5000, 100);
    printReport({ name: 'onResize_large', ...summarize('onResize_large', results.onResize_large) });
    console.log('');

    // Immer proxy 引用比较语义验证（review r2 §2.1 假设 A4）
    console.log('--- Immer draft 代理引用比较语义验证 ---');
    results.immerProxyVerify = await verifyImmerProxyReference();
    console.log('结果:', results.immerProxyVerify);
    console.log('');

    console.log('');
    console.log('=== [BASELINE DONE] ===');
    console.log('请把上述输出复制到 .trae/skills/oss-visual-designer-project-context/research/refactor-single-source/baseline-2026-07-27.md');
    console.log('results 对象已挂到 window.__baselineResults，可直接读取');
    window.__baselineResults = results;
};

console.log('[perf-baseline] 已加载。在控制台执行 window.runPerfBaseline() 开始测量');
