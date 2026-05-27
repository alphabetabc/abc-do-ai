---
name: 'assurance-progress'
description: 'Maintains the AssuranceProgress component and its sub-components (ProgressList, ProgressDetailEditor). Invoke when working on emergency support process step editor, modal forms, or assurance progress tracking features.'
---

# AssuranceProgress Component Maintenance

## Component Structure

```
apps/main/app/components/left/assurance-progress/
├── index.tsx                    # Main AssuranceProgress widget container
├── progress-list/
│   ├── index.tsx               # ProgressList - displays progress items horizontally
│   ├── index.css               # Styles for progress list
│   ├── presets.ts              # Preset configurations
│   ├── process-detail/
│   │   ├── index.tsx           # ProcessDetail - Timeline view for process steps
│   │   └── index.css           # Process detail styles
│   ├── progress-detail-editor/  # Main editor component
│   │   ├── index.tsx           # ProgressDetailEditor - CRUD table for process steps
│   │   ├── api.ts              # Mock API functions (partial)
│   │   ├── types.ts           # TypeScript interfaces
│   │   └── styled.ts          # Styled components
│   └── progress-item/
│       ├── index.tsx           # Individual progress item
│       └── ProgressImage.tsx    # Progress image component
```

## ProgressDetailEditor Component

### Props

| Prop          | Type                               | Description                               |
| ------------- | ---------------------------------- | ----------------------------------------- |
| `emerEventId` | `string`                           | **Required** - Current emergency event ID |
| `onSubmit?`   | `(data: ProgressDetail[]) => void` | Callback when submitting all data         |

### Features

- **Table Columns**: 序号, 大环节, 子环节, 内容, 时间, 操作
- **Empty State**: "暂无数据，请点击下方按钮添加环节" with custom empty image (IconEmpty)
- **Modal Form**: Shared modal for add/edit operations (edit button is currently commented out)
- **Required Fields**: 大环节, 内容, 时间
- **Message Notifications**: Ant Design messageApi with contextHolder for success/error feedback
- **Delete Confirmation**: Uses Popconfirm instead of Popover
- **Delete Disable Logic**: Delete button disabled when !record.content && !record.subPhase

### 5 Independent useRequest Hooks

| useRequest | Purpose                                                           | Loading State            |
| ---------- | ----------------------------------------------------------------- | ------------------------ |
| #1         | Fetch list data from `getFloodControlGlobalApi`                   | `loadingList`            |
| #2         | Fetch major phase options from `getFloodControlGlobalNameListApi` | `loadingOptions`         |
| #3         | Add new record from `insertFloodControlGlobalApi`                 | `loadingAdd` (manual)    |
| #4         | Update record from `updateProgressDetailApi` (mock)               | `loadingUpdate` (manual) |
| #5         | Delete record from `deleteFloodControlGlobalApi`                  | `loadingDelete` (manual) |

### API Endpoints

| API                                                 | Description               | Source   |
| --------------------------------------------------- | ------------------------- | -------- |
| `getFloodControlGlobalApi({ emerEventId })`         | Fetch process list        | Real API |
| `getFloodControlGlobalNameListApi({ emerEventId })` | Fetch major phase options | Real API |
| `insertFloodControlGlobalApi(data)`                 | Add new record            | Real API |
| `updateProgressDetailApi(data)`                     | Update record             | Mock     |
| `deleteFloodControlGlobalApi({ id })`               | Delete record             | Real API |

#### API Field Mapping

**API Response → Component State Mapping:**

| API Field  | Component Field | Description                     |
| ---------- | --------------- | ------------------------------- |
| `id`       | `id`            | Unique identifier               |
| `level1`   | `majorPhase`    | 大环节名称                      |
| `level2`   | `subPhase`      | 子环节名称 ("" → empty string)  |
| `content`  | `content`       | 环节内容                        |
| `dataTime` | `time`          | 时间 (YYYY-MM-DD HH:mm:ss)      |
| (computed) | `serialNumber`  | Auto-calculated index (1-based) |

**Major Phase Options Data Processing:**

```typescript
data.forEach((row: any) => {
  if (row.responseName) {
    majorPhaseSet.add(row.responseName);
  }
});
```

Uses Set to deduplicate, extracts from `responseName` field.

#### API Request Parameters

**1. `getFloodControlGlobalApi`**

```typescript
{
  emerEventId: string; // 当前保障事件ID
}
```

**2. `getFloodControlGlobalNameListApi`**

```typescript
{
  emerEventId: string; // 当前保障事件ID
}
```

**3. `insertFloodControlGlobalApi`**

```typescript
{
  emerEventId: string;  // 当前保障事件ID
  level1: string;       // 大环节名称
  level2?: string;      // 子环节名称 (optional)
  content: string;      // 环节内容
  dataTime: string;     // 时间 (YYYY-MM-DD HH:mm:ss)
}
```

**4. `deleteFloodControlGlobalApi`**

```typescript
{
  id: string; // 记录唯一标识符
}
```

**5. `updateProgressDetailApi` (Mock)**

```typescript
{
  majorPhase: string; // 大环节名称
  subPhase: string; // 子环节名称
  content: string; // 环节内容
  time: string; // 时间
}
```

### Key Implementation Details

1. **State Management**: Uses `useSetState` from ahooks
2. **Data Fetching**:
   - List auto-executes on mount
   - Options auto-executes on mount
   - Manual refresh via `refreshList()`
3. **Event Handlers**: Wrapped with `useMemoizedFn` for stable references
4. **Modal Theme**: Uses partial Ant Design theme override:
   ```typescript
   Input: { fontSize: 16, height: 32 },
   Select: { fontSize: 16, height: 32 },
   DatePicker: { fontSize: 16, height: 32 },
   Button: { fontSize: 16 }
   ```
5. **Modal Placement**: Uses `getContainer={() => rootElRef.current}` to render inside parent container
6. **Form Validation**: Ant Design Form with rules for required fields
7. **Time Formatting**: If user doesn't select time, defaults to current time formatted as `YYYY-MM-DD HH:mm:ss`
8. **Table Scroll**: Scroll height y=490, container total height h-[600px]
9. **Edit Feature**: Edit button is commented out in render, ready to uncomment when backend update API is ready

### Usage

```tsx
import { ProgressDetailEditor } from "./progress-list/progress-detail-editor";

// Basic usage
<ProgressDetailEditor emerEventId="event-123" />

// With submit callback
<ProgressDetailEditor
  emerEventId="event-123"
  onSubmit={(data) => console.log(data)}
/>
```

### Type Definitions (types.ts)

```typescript
interface ProgressDetail {
  id: string;
  serialNumber: number;
  majorPhase: string;
  subPhase: string;
  content: string;
  time: string;
}

interface MajorPhase {
  label: string;
  value: string;
}

interface ProgressDetailRequest {
  majorPhase: string;
  subPhase: string;
  content: string;
  time: string;
}

interface ProgressDetailEditorState {
  dataSource: ProgressDetail[];
  modalVisible: boolean;
  editingRecord: ProgressDetail | null;
  majorPhaseOptions: MajorPhase[];
}
```

## Common Tasks

### 1. Adding a new field to the table

1. Update `types.ts` - add field to `ProgressDetail` and `ProgressDetailRequest`
2. Update columns array in `index.tsx` - add column definition with appropriate width, fontSize=18
3. Update modal form - add StyledFormItem with validation rules as needed
4. Update API calls to include the new field in request payload
5. Add field mapping in onSuccess callback of `getFloodControlGlobalApi`

### 2. Modifying form validation

Find the `StyledFormItem` in the modal and add/modify `rules` prop:

```tsx
<StyledFormItem
    label="字段名"
    name="fieldName"
    rules={[{ required: true, message: "错误提示" }]}
>
```

### 3. Changing API endpoints

- Real APIs are imported from `@/request/left`
- Mock API is in local `api.ts` - replace with real API call
- Ensure proper data mapping between API response and `ProgressDetail` format
- Maintain consistent success/error message patterns

### 4. Enabling edit functionality

1. Replace mock `updateProgressDetailApi` in local `api.ts` with real backend API
2. Uncomment the edit button in the action column:

```tsx
<Button
  type="link"
  onClick={() => handleOpenModal(record)}
  style={{ color: '#1890ff', padding: 0 }}
>
  编辑
</Button>
```

### 5. Styling modifications

- Component-specific styles: `styled.ts` (StyledContainer, Footer, EmptyText, ModalContent, StyledFormItem, ModalFooter)
- Page-level styles: `index.css` in progress-list folder
- Modal theme: Adjust `modalTheme` object in `index.tsx`
- Table cell styles: All cells use fontSize 18, apply ellipsis styles for text fields

---

## Common Tasks for ProcessDetail (Timeline)

### 1. Modify timeline time format

In `process-detail/index.tsx`, update dayjs format string:

```typescript
{
  contentItem.dataTime ? dayjs(contentItem.dataTime).format('MM-DD HH:mm') : '';
}
```

Common format variations:

- "MM-DD HH:mm" → 05-09 14:30
- "MM月DD日 HH:mm" → 05月09日 14:30
- "YYYY-MM-DD HH:mm" → 2026-05-09 14:30

### 2. Adjust timeline styles

Modify the `StyledTimeLine` styled-component to customize:

- Timeline item dot size
- Tail arrow colors and images
- Label text font sizes and colors
- Content area width and positioning

### 3. Add new display field in timeline

1. Modify grouping logic in onSuccess callback of useRequest
2. Add the new field to contentItem structure
3. Update render section in Timeline items children to display the new field

## File Dependencies

- **Imports ahooks**: `useSetState`, `useRequest`, `useMemoizedFn`
- **Imports Ant Design**: Button, Input, Input.TextArea, DatePicker, ConfigProvider, Form, Modal, Select, message, Popconfirm
- **Imports dayjs** for date formatting and parsing
- **Imports next/image** for empty state image (IconEmpty from @/images/icon-empty.png)
- **Styled components** from local `styled.ts`
- **Types** from local `types.ts`
- **APIs**: Real APIs from `@/request/left`, mock API from local `api.ts`
- **StyledTable** from `@/app/components/ui/styled-table`
