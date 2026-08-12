/**
 * 批量下载辽宁省 geojson（省/市/区县三级）
 *
 * 数据源：阿里云 DataV GeoAtlas
 *   https://geo.datav.aliyun.com/areas_v3/bound/{adcode}_full.json
 *
 * adcode 来源：从 map-config.json 提取后硬编码，无外部依赖。
 *
 * 用法：
 *   node download-liaoning-geojson.mjs              # 下载到默认路径
 *   node download-liaoning-geojson.mjs --dry-run    # 只打印计划，不下载
 *   node download-liaoning-geojson.mjs --out <dir>  # 自定义输出目录
 *
 * 输出目录结构：
 *   {out}/
 *   ├── 210000.json          辽宁省（含14地市边界）
 *   ├── 210100.json          沈阳市（含区县边界）
 *   ├── 210102.json          和平区
 *   ├── ...
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- 配置 ---

const BASE_URL = "https://geo.datav.aliyun.com/areas_v3/bound";
const DEFAULT_OUT = resolve(__dirname, "../../../../frontend/public/static/map/geojson");

// --- adcode 列表（从 map-config.json 提取，115 个） ---

// 共 115 个（1 省 + 14 市 + 100 区县）
const ITEMS = [
    { name: "辽宁省", adcode: "210000", level: "province" },
    { name: "沈阳市", adcode: "210100", level: "city" },
    { name: "大连市", adcode: "210200", level: "city" },
    { name: "鞍山市", adcode: "210300", level: "city" },
    { name: "抚顺市", adcode: "210400", level: "city" },
    { name: "本溪市", adcode: "210500", level: "city" },
    { name: "丹东市", adcode: "210600", level: "city" },
    { name: "锦州市", adcode: "210700", level: "city" },
    { name: "营口市", adcode: "210800", level: "city" },
    { name: "阜新市", adcode: "210900", level: "city" },
    { name: "辽阳市", adcode: "211000", level: "city" },
    { name: "盘锦市", adcode: "211100", level: "city" },
    { name: "铁岭市", adcode: "211200", level: "city" },
    { name: "朝阳市", adcode: "211300", level: "city" },
    { name: "葫芦岛市", adcode: "211400", level: "city" },
    { name: "和平区", adcode: "210102", level: "district" },
    { name: "沈河区", adcode: "210103", level: "district" },
    { name: "大东区", adcode: "210104", level: "district" },
    { name: "皇姑区", adcode: "210105", level: "district" },
    { name: "铁西区", adcode: "210106", level: "district" },
    { name: "苏家屯区", adcode: "210111", level: "district" },
    { name: "浑南区", adcode: "210112", level: "district" },
    { name: "沈北新区", adcode: "210113", level: "district" },
    { name: "于洪区", adcode: "210114", level: "district" },
    { name: "辽中区", adcode: "210115", level: "district" },
    { name: "康平县", adcode: "210123", level: "district" },
    { name: "法库县", adcode: "210124", level: "district" },
    { name: "新民市", adcode: "210181", level: "district" },
    { name: "中山区", adcode: "210202", level: "district" },
    { name: "西岗区", adcode: "210203", level: "district" },
    { name: "沙河口区", adcode: "210204", level: "district" },
    { name: "甘井子区", adcode: "210211", level: "district" },
    { name: "旅顺口区", adcode: "210212", level: "district" },
    { name: "金州区", adcode: "210213", level: "district" },
    { name: "普兰店区", adcode: "210214", level: "district" },
    { name: "长海县", adcode: "210224", level: "district" },
    { name: "瓦房店市", adcode: "210281", level: "district" },
    { name: "庄河市", adcode: "210283", level: "district" },
    { name: "铁东区", adcode: "210302", level: "district" },
    { name: "铁西区", adcode: "210303", level: "district" },
    { name: "立山区", adcode: "210304", level: "district" },
    { name: "千山区", adcode: "210311", level: "district" },
    { name: "台安县", adcode: "210321", level: "district" },
    { name: "岫岩满族自治县", adcode: "210323", level: "district" },
    { name: "海城市", adcode: "210381", level: "district" },
    { name: "新抚区", adcode: "210402", level: "district" },
    { name: "东洲区", adcode: "210403", level: "district" },
    { name: "望花区", adcode: "210404", level: "district" },
    { name: "顺城区", adcode: "210411", level: "district" },
    { name: "抚顺县", adcode: "210421", level: "district" },
    { name: "新宾满族自治县", adcode: "210422", level: "district" },
    { name: "清原满族自治县", adcode: "210423", level: "district" },
    { name: "平山区", adcode: "210502", level: "district" },
    { name: "溪湖区", adcode: "210503", level: "district" },
    { name: "明山区", adcode: "210504", level: "district" },
    { name: "南芬区", adcode: "210505", level: "district" },
    { name: "本溪满族自治县", adcode: "210521", level: "district" },
    { name: "桓仁满族自治县", adcode: "210522", level: "district" },
    { name: "元宝区", adcode: "210602", level: "district" },
    { name: "振兴区", adcode: "210603", level: "district" },
    { name: "振安区", adcode: "210604", level: "district" },
    { name: "宽甸满族自治县", adcode: "210624", level: "district" },
    { name: "东港市", adcode: "210681", level: "district" },
    { name: "凤城市", adcode: "210682", level: "district" },
    { name: "古塔区", adcode: "210702", level: "district" },
    { name: "凌河区", adcode: "210703", level: "district" },
    { name: "太和区", adcode: "210711", level: "district" },
    { name: "黑山县", adcode: "210726", level: "district" },
    { name: "义县", adcode: "210727", level: "district" },
    { name: "凌海市", adcode: "210781", level: "district" },
    { name: "北镇市", adcode: "210782", level: "district" },
    { name: "站前区", adcode: "210802", level: "district" },
    { name: "西市区", adcode: "210803", level: "district" },
    { name: "鲅鱼圈区", adcode: "210804", level: "district" },
    { name: "老边区", adcode: "210811", level: "district" },
    { name: "盖州市", adcode: "210881", level: "district" },
    { name: "大石桥市", adcode: "210882", level: "district" },
    { name: "海州区", adcode: "210902", level: "district" },
    { name: "新邱区", adcode: "210903", level: "district" },
    { name: "太平区", adcode: "210904", level: "district" },
    { name: "清河门区", adcode: "210905", level: "district" },
    { name: "细河区", adcode: "210911", level: "district" },
    { name: "阜新蒙古族自治县", adcode: "210921", level: "district" },
    { name: "彰武县", adcode: "210922", level: "district" },
    { name: "白塔区", adcode: "211002", level: "district" },
    { name: "文圣区", adcode: "211003", level: "district" },
    { name: "宏伟区", adcode: "211004", level: "district" },
    { name: "弓长岭区", adcode: "211005", level: "district" },
    { name: "太子河区", adcode: "211011", level: "district" },
    { name: "辽阳县", adcode: "211021", level: "district" },
    { name: "灯塔市", adcode: "211081", level: "district" },
    { name: "双台子区", adcode: "211102", level: "district" },
    { name: "兴隆台区", adcode: "211103", level: "district" },
    { name: "大洼区", adcode: "211104", level: "district" },
    { name: "盘山县", adcode: "211122", level: "district" },
    { name: "银州区", adcode: "211202", level: "district" },
    { name: "清河区", adcode: "211204", level: "district" },
    { name: "铁岭县", adcode: "211221", level: "district" },
    { name: "西丰县", adcode: "211223", level: "district" },
    { name: "昌图县", adcode: "211224", level: "district" },
    { name: "调兵山市", adcode: "211281", level: "district" },
    { name: "开原市", adcode: "211282", level: "district" },
    { name: "双塔区", adcode: "211302", level: "district" },
    { name: "龙城区", adcode: "211303", level: "district" },
    { name: "朝阳县", adcode: "211321", level: "district" },
    { name: "建平县", adcode: "211322", level: "district" },
    { name: "喀喇沁左翼蒙古族自治县", adcode: "211324", level: "district" },
    { name: "北票市", adcode: "211381", level: "district" },
    { name: "凌源市", adcode: "211382", level: "district" },
    { name: "连山区", adcode: "211402", level: "district" },
    { name: "龙港区", adcode: "211403", level: "district" },
    { name: "南票区", adcode: "211404", level: "district" },
    { name: "绥中县", adcode: "211421", level: "district" },
    { name: "建昌县", adcode: "211422", level: "district" },
    { name: "兴城市", adcode: "211481", level: "district" },
];

// --- 参数解析 ---

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const outIdx = args.indexOf("--out");
const outDir = outIdx !== -1 && args[outIdx + 1] ? resolve(args[outIdx + 1]) : DEFAULT_OUT;

// --- 工具函数 ---

async function fetchJson(url) {
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${url}`);
    }
    return resp.json();
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

// --- 下载逻辑 ---

async function downloadOne(item) {
    // 省/市级用 _full（含下级行政区边界）；区县级用不带 _full（区县无下级）
    const suffix = item.level === "district" ? "" : "_full";
    const url = `${BASE_URL}/${item.adcode}${suffix}.json`;
    const fileName = `${item.adcode}.json`;
    const filePath = join(outDir, fileName);

    if (dryRun) {
        console.log(`[DRY-RUN] ${item.adcode} ${item.name} → ${filePath}`);
        return true;
    }

    try {
        console.log(`⬇️  ${item.adcode} ${item.name}...`);
        const data = await fetchJson(url);
        writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
        const sizeKB = (JSON.stringify(data).length / 1024).toFixed(1);
        console.log(`✅ ${fileName} (${sizeKB} KB)`);
        return true;
    } catch (err) {
        console.error(`❌ ${item.adcode} ${item.name}: ${err.message}`);
        return false;
    }
}

// --- 主逻辑 ---

async function main() {
    console.log("=== 辽宁省 geojson 批量下载 ===");
    console.log(`输出目录: ${outDir}`);
    console.log(`模式: ${dryRun ? "DRY-RUN（只打印）" : "实际下载"}`);
    console.log(`文件数: ${ITEMS.length}（1 省 + 14 市 + 100 区县）`);
    console.log("");

    if (!dryRun && !existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
        console.log(`📁 创建目录: ${outDir}\n`);
    }

    let success = 0;
    let fail = 0;

    for (const item of ITEMS) {
        const ok = await downloadOne(item);
        if (ok) success++;
        else fail++;
        if (!dryRun) await sleep(200);
    }

    console.log("\n=== 下载完成 ===");
    console.log(`成功: ${success}，失败: ${fail}，合计: ${ITEMS.length}`);
    console.log(`文件位置: ${outDir}`);

    if (fail > 0) {
        console.log("\n⚠️  部分文件下载失败，可重新运行脚本重试。");
    }
}

main().catch((err) => {
    console.error("致命错误:", err);
    process.exit(1);
});
