---
name: 'emergency-api-generator'
description: 'Generates standardized API functions for emergency support modules. Invoke when user asks to create API functions for viewItemId data fetching, or when adding new data request functions to center.ts.'
---

# Emergency Support API Generator

This skill generates standardized API functions for the GD Emergency Support project, following the established pattern in `apps/main/request/center.ts`.

## API Patterns

### GET API Pattern (Query/Fetch)

```typescript
/**
 * @see http://<interface-url>
 */
export const get<Xxx>Api = async (opts: any) => {
    const [err, rows] = await runPromise(
        getViewItemDataApi({
            localMockUrl: "/static/mock/emergency/<mock-file-name>.json",
            baseUrlType,
            loggerText: "<page-location>-<feature-name>",
            params: {
                viewItemId: "<view-item-id>",
                viewPageId: "<view-page-id>",
                viewPageArgs: {
                    ...(opts ?? {}),
                },
            },
            converter: defaultConverter,
        })
    );

    if (err || isEmpty(rows)) {
        return [];
    }

    return rows;
};
```

### INSERT API Pattern (Write/Submit)

```typescript
/**
 * @see http://<interface-url>
 */
export const insert<Xxx>Api = async (viewPageArgs: {
    /** 参数1描述 */
    param1: any;
    /** 参数2描述 */
    param2?: any;
}) => {
    const [err] = await runPromise(
        getViewItemDataApi({
            localMockUrl: "/static/mock/emergency/<mock-file-name>.json",
            baseUrlType,
            loggerText: "<page-location>-<feature-name>",
            params: {
                viewPageId: "<view-page-id>",
                viewItemId: "<view-item-id>",
                viewPageArgs,
            },
            converter: defaultConverter,
        })
    );
    if (err) return [];
    return [{ ...viewPageArgs }];
};
```

## Required Inputs

To generate an API, you need:

1. **Interface URL** - The API documentation link (for JSDoc @see)
2. **Mock JSON file** - Located at `apps/main/public/static/mock/emergency/`
3. **viewItemId** - Found in the mock JSON's `data.viewItemId`
4. **viewPageId** - Found in the mock JSON's `data.viewPageId`
5. **loggerText** - Human-readable description: `<page-location>-<feature-name>`
6. **API function name** - Format: `get<FeatureName>Api`
7. **opts type** - Parameters passed via `viewPageArgs` (if any)

## Page Locations (loggerText前缀)

| Page                  | Location |
| --------------------- | -------- |
| guarantee-left-page   | 左屏     |
| guarantee-middle-page | 中屏     |
| guarantee-right-page  | 右屏     |

## Generation Steps

### Step 1: Analyze the Input

Extract from user input or mock JSON:

- `viewItemId` - determines mock file name and API function reference
- `viewPageId` - determines loggerText prefix
- Parameters and their descriptions from the schema

### Step 2: Determine Naming

- `viewPageId` → determines `loggerText` prefix:
  - `guarantee-left-page` → "左屏"
  - `guarantee-middle-page` → "中屏"
  - `guarantee-right-page` → "右屏"
- `viewItemId` → determines function name and mock file reference
- API type → determines pattern (GET vs INSERT)

### Step 3: Create Mock JSON File (if not exists)

**CRITICAL**: If the mock JSON file does not exist, you MUST create it before generating the API.

Mock file location: `apps/main/public/static/mock/emergency/<viewItemId>.json`

Mock JSON structure:

```json
{
  "code": 200,
  "message": null,
  "messageVisible": false,
  "clientRequestId": "clientRequestId-<uuid>",
  "serverUsingTimeMS": 10,
  "data": {
    "viewPageId": "<viewPageId>",
    "viewItemId": "<viewItemId>",
    "viewItemGroupId": "<viewItemId>Group",
    "viewItemData": {
      "title": "<title>",
      "titleIcon": "",
      "description": "<description>",
      "author": "xiegen",
      "header": {
        "dimFieldList": [],
        "counterFieldList": [
          {
            "dataType": "String",
            "fieldLabel": "<fieldLabel>",
            "fieldName": "<fieldName>",
            "fieldUnit": "",
            "list": "true"
          }
        ]
      },
      "rows": [
        {
          "<fieldName>": "<test-value>"
        }
      ]
    }
  }
}
```

### Step 4: Generate API Function

Follow the appropriate pattern (GET or INSERT) from the API Patterns section.

```typescript
/**
 * @see http://10.10.2.8:9091/project/1179/interface/api/34148
 */
export const getPhaseIIPopUpLineChartApi = async (opts: any) => {
  const [err, rows] = await runPromise(
    getViewItemDataApi({
      localMockUrl:
        '/static/mock/emergency/emergency-support-phase-i-i-pop-up-line-chart.json',
      baseUrlType,
      loggerText: '右屏-应急保障二阶段-弹窗-折线图',
      params: {
        viewItemId: 'emergency-support-phase-i-i-pop-up-line-chart',
        viewPageId: 'guarantee-right-page',
        viewPageArgs: {
          ...(opts ?? {}),
        },
      },
      converter: defaultConverter,
    })
  );

  if (err || isEmpty(rows)) {
    return [];
  }

  return rows;
};
```

## Naming Conventions

### Function Names

- `get` + `<FeatureName>` + `Api`
- FeatureName: PascalCase, remove hyphens
- Examples:
  - `getDispatchMapColorsApi`
  - `getEmergencySitePointsApi`
  - `getPhaseIIPopUpLineChartApi`
  - `getTyphoonListApi`

### Mock File Names

- Use the exact `viewItemId` value as the file name
- Location: `apps/main/public/static/mock/emergency/`
- Extension: `.json`

### Logger Text

Format: `<page-location>-<feature-description>`

Examples:

- "中屏-指挥调度-地图颜色"
- "右屏-应急保障二阶段-弹窗-折线图"
- "左屏-预警通知-故障专业"

## Error Handling

All APIs follow this error handling pattern:

```typescript
if (err || isEmpty(rows)) {
  return [];
}
return rows;
```

## Required Imports

Ensure these imports exist at the top of `center.ts`:

```typescript
import { isEmpty, groupBy, isNil, mapValues } from 'lodash-es';
import { runPromise } from '@/utils/runPromise';
import { defaultConverter, getViewItemDataApi } from '@/utils/request';
```

## Output Location

Generated APIs should be added to:

- **File**: `apps/main/request/center.ts`
- **Position**: Group with related APIs (by page location)
- **Export**: Always use `export const`

## Parameter Comments

**CRITICAL**: Every parameter in `viewPageArgs` MUST have a JSDoc comment describing its meaning.

Example with comments:

```typescript
export const insertFloodControlGlobalApi = async (viewPageArgs: {
    /** 当前保障id */
    emerEventId: any;
    /** 内容 */
    content: any;
    /** 当前保障时间 */
    dataTime: any;
    /** 大环节名称 */
    level1: any;
    /** 小环节名称（可选） */
    level2?: any;
}) => {
```

Example without comments (INCORRECT):

```typescript
export const insertFloodControlGlobalApi = async (viewPageArgs: {
    emerEventId: any;
    content: any;
    dataTime: any;
    level1: any;
    level2?: any;
}) => {
```

## Invocation Triggers

**MUST invoke this skill IMMEDIATELY when user provides:**

1. A new API endpoint URL and asks to create an API function
2. A mock JSON file and requests API generation
3. Any `viewItemId` and `viewPageId` combination for data fetching
4. Any request to add new API to `center.ts`, `left.ts`, or similar request files

## Verification Checklist

- [ ] Function name follows `get<FeatureName>Api` or `insert<FeatureName>Api` pattern
- [ ] `@see` tag contains the interface documentation URL
- [ ] `localMockUrl` is present and points to correct mock file
- [ ] **Mock JSON file exists** at `apps/main/public/static/mock/emergency/<viewItemId>.json`
- [ ] `loggerText` follows `<page-location>-<feature-name>` format
- [ ] `viewItemId` matches the provided or extracted value
- [ ] `viewPageId` matches the provided or extracted value
- [ ] Error handling returns `[]` on failure
- [ ] Function is exported
- [ ] **ALL parameters have JSDoc comments with descriptions**
