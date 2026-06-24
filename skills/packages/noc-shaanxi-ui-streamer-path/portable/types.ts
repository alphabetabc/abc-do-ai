/**
 * 路径点坐标接口
 */
export interface StreamerPoint {
    x: number;
    y: number;
}

/**
 * 流光颜色配置接口
 */
export interface StreamerColor {
    /** 流光尾部颜色 */
    tail: string;
    /** 流光头部颜色 */
    head: string;
}

/**
 * 流光线条粗细配置接口
 */
export interface StreamerWidth {
    /** 流光尾部粗细（像素） */
    tail: number;
    /** 流光头部粗细（像素） */
    head: number;
}

/**
 * 轨道配置接口
 */
export interface StreamerTrack {
    /** 是否显示轨道，默认 false */
    visible?: boolean;
    /** 轨道颜色，默认 rgba(255,255,255,0.2) */
    color?: string;
    /** 轨道线宽，默认 1 */
    width?: number;
}

/**
 * 流光控制 API 接口
 */
export interface StreamerApi {
    /** 开始动画 */
    start: () => void;
    /** 停止动画 */
    stop: () => void;
    /** 暂停动画 */
    pause: () => void;
}

/**
 * 流光路径动画组件属性接口
 */
export interface StreamerProps {
    /** 路径关键点数组，定义流光的运动路径 */
    points: StreamerPoint[];
    /** Canvas 宽度，默认自适应父容器 */
    width?: number;
    /** Canvas 高度，默认自适应父容器 */
    height?: number;
    /** 流光颜色配置，默认尾部 #0098ff，头部 #ffffff */
    colors?: StreamerColor;
    /** 流光线条粗细配置，默认尾部 1px，头部 2px */
    lineWidth?: StreamerWidth;
    /** 流光移动速度，默认 2.5 */
    speed?: number;
    /** 流光总长度，默认 220 */
    streamerLength?: number;
    /** 动画完成回调，每完成一圈触发一次 */
    onAnimationComplete?: () => void;
    /** 流光绘制步数，默认 200 */
    steps?: number;
    /** 容器样式类名 */
    className?: string;
    /** 容器内联样式 */
    style?: React.CSSProperties;
    /** 运行次数，默认 -1（无限循环） */
    runCount?: number;
    /** 每轮运行之间的间隔时间（毫秒），默认 0 */
    interval?: number;
    /** 组件创建时回调，暴露控制 API */
    onCreation?: (api: StreamerApi) => void;
    /** 轨道配置 */
    track?: StreamerTrack;
    /** 是否自动开始动画，默认 true */
    autoStart?: boolean;
}