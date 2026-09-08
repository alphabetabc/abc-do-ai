# 网络覆盖中屏GIS配置升级文档（简洁版）

> **实施状态：已完成**

---

## 一、需要修改的配置文件

**文件路径**：`public/environment-local.json`

### 修改内容（JSON格式）

```json
{
  "networkGisConfig": {
    "center": [108.63143417040855, 35.580495475851706],
    "zoom": 7.28,
    "minZoom": 7.28,
    "maxZoom": 7.28,
    "bgSizeWidth": "805px",
    "bgSizeHeight": "948px",
    "bgPositionX": "15px",
    "bgPositionY": "-17px",
    "imageGis": {
      "list": {
        "1161128211": {
          "2g": { "image": "2g.png", "zIndex": 0, "opacity": 1 },
          "4g": { "image": "4g.png", "zIndex": 1, "opacity": 1 },
          "5g": { "image": "5g.png", "zIndex": 2, "opacity": 1 },
          "highPrecision": { "image": "highPrecision.png", "zIndex": 3, "opacity": 1 },
          "wot": { "image": "物联网基站.png", "zIndex": 4, "opacity": 1 },
          "animate-star": { "image": "animate-star.svg", "zIndex": 5 },
          "optical-cable-fir": {
            "image": "一干光缆.png",
            "zIndex": 6,
            "opacity": 1,
            "animatePathPoints": [
              { "x": 248.331, "y": 209 },
              { "x": 308.638, "y": 237.805 },
              { "x": 392.424, "y": 227 },
              { "x": 416.814, "y": 270.452 },
              { "x": 453, "y": 310 },
              { "x": 468.5, "y": 336.5 },
              { "x": 458, "y": 403.5 },
              { "x": 462.143, "y": 431.556 },
              { "x": 440.506, "y": 449.5 },
              { "x": 412.924, "y": 541.407 },
              { "x": 460, "y": 572.5 },
              { "x": 411, "y": 589 },
              { "x": 406, "y": 600.5 },
              { "x": 379.5, "y": 589 },
              { "x": 273.5, "y": 589 },
              { "x": 215.645, "y": 585.5 },
              { "x": 144.5, "y": 634 },
              { "x": 187, "y": 667.5 },
              { "x": 200, "y": 726.5 },
              { "x": 112.5, "y": 754 }
            ]
          },
          "optical-cable-sec": {
            "image": "二干光缆.png",
            "zIndex": 7,
            "opacity": 1,
            "animatePathPoints": [
              { "x": 494.833, "y": 92 },
              { "x": 498.041, "y": 148 },
              { "x": 557.5, "y": 235.5 },
              { "x": 490.25, "y": 277 },
              { "x": 468.25, "y": 337.5 },
              { "x": 464.584, "y": 371 },
              { "x": 456, "y": 402.5 },
              { "x": 464.584, "y": 428 },
              { "x": 437.542, "y": 452.5 },
              { "x": 416, "y": 540.5 },
              { "x": 380, "y": 585.5 },
              { "x": 408, "y": 597 },
              { "x": 403.625, "y": 602.5 },
              { "x": 358, "y": 648.5 },
              { "x": 289, "y": 703 },
              { "x": 197.5, "y": 727 }
            ]
          }
        }
      }
    }
  }
}
```

---

## 二、需要部署的静态资源文件

**目标目录**：`static/images/center-network-coverage/map/`

| 文件名 | 说明 |
|--------|------|
| `2g.png` | 2G网络覆盖图 |
| `4g.png` | 4G网络覆盖图 |
| `5g.png` | 5G网络覆盖图 |
| `highPrecision.png` | 高精度基站层 |
| `物联网基站.png` | 物联网基站层 |
| `animate-star.svg` | 动画星星图标 |
| `一干光缆.png` | 一干光缆层 |
| `二干光缆.png` | 二干光缆层 |

---

## 三、升级步骤

1. **备份**：复制 `environment-local.json` 为 `environment-local.json.bak`
2. **修改配置**：用上述JSON更新 `networkGisConfig` 节点
3. **上传资源**：将8个图片文件上传至 `static/images/center-network-coverage/map/`
4. **重启服务**：重启前端服务使配置生效

---

## 四、验证项

| 检查项 | 预期结果 |
|--------|----------|
| 地图显示 | 陕西省居中，不可缩放 |
| 2G/4G/5G图层 | 正常显示 |
| 光缆流光 | 沿路径流动 |