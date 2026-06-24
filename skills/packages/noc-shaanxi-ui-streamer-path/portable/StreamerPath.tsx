import { useEffect, useMemo, useRef, useState } from 'react';
import { interpolate as d3Interpolate } from 'd3-interpolate';

import { StreamerPathContainer } from './Container';
import {
    StreamerPoint,
    StreamerColor,
    StreamerWidth,
    StreamerProps,
    StreamerApi,
    StreamerTrack,
} from './types';
import { useLatest, useMemoizedFn, useElementSize, useMemorizedObject } from './hooks';

interface Segment {
    start: StreamerPoint;
    end: StreamerPoint;
    length: number;
    startDist: number;
    endDist: number;
}

const DEFAULT_COLORS: StreamerColor = { head: '#ffffff', tail: '#0098FF' };
const DEFAULT_LINE_WIDTH: StreamerWidth = { head: 2, tail: 1 };
const DEFAULT_TRACK: StreamerTrack = { visible: false, color: 'rgba(255,255,255,0.2)', width: 1 };

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 300;
const DEFAULT_STEPS = 200;
const DEFAULT_RUN_COUNT = -1;
const DEFAULT_INTERVAL = 0;
const DEFAULT_AUTO_START = true;
const DEFAULT_SPEED = 2.5;
const DEFAULT_STREAMER_LENGTH = 220;

const getPointAtDistance = (
    segments: Segment[],
    totalLength: number,
    dist: number,
): StreamerPoint | null => {
    if (dist < 0 || dist > totalLength) return null;
    for (const seg of segments) {
        if (dist >= seg.startDist && dist <= seg.endDist) {
            const ratio = (dist - seg.startDist) / seg.length;
            return {
                x: seg.start.x + (seg.end.x - seg.start.x) * ratio,
                y: seg.start.y + (seg.end.y - seg.start.y) * ratio,
            };
        }
    }
    return null;
};

export const StreamerPath = (props: StreamerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const intervalTimerRef = useRef<number | undefined>(undefined);

    const onAnimationCompleteRef = useLatest(props.onAnimationComplete);
    const onCreationRef = useLatest(props.onCreation);

    const [isRunning, setIsRunning] = useState(props.autoStart ?? DEFAULT_AUTO_START);
    const [isPaused, setIsPaused] = useState(false);

    const hasExplicitSize = props.width !== undefined || props.height !== undefined;
    const measuredSize = hasExplicitSize ? null : useElementSize(containerRef);

    const width = props.width ?? measuredSize?.width ?? DEFAULT_WIDTH;
    const height = props.height ?? measuredSize?.height ?? DEFAULT_HEIGHT;
    const speed = props.speed ?? DEFAULT_SPEED;
    const streamerLength = props.streamerLength ?? DEFAULT_STREAMER_LENGTH;
    const steps = props.steps ?? DEFAULT_STEPS;
    const interval = props.interval ?? DEFAULT_INTERVAL;

    const positionRef = useRef<number>(streamerLength);
    const currentRunRef = useRef<number>(0);

    const colors = useMemorizedObject(props.colors ?? DEFAULT_COLORS);
    const lineWidth = useMemorizedObject(props.lineWidth ?? DEFAULT_LINE_WIDTH);
    const track = useMemorizedObject(props.track ?? DEFAULT_TRACK);

    const pathData = useMemo(() => {
        if (!props.points || props.points.length < 2) {
            return { segments: [] as Segment[], totalLength: 0 };
        }
        const segments: Segment[] = [];
        let totalLength = 0;
        for (let i = 0; i < props.points.length - 1; i++) {
            const p1 = props.points[i];
            const p2 = props.points[i + 1];
            const len = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            segments.push({
                start: p1,
                end: p2,
                length: len,
                startDist: totalLength,
                endDist: totalLength + len,
            });
            totalLength += len;
        }
        return { segments, totalLength };
    }, [props.points]);

    const resetAnimation = useMemoizedFn(() => {
        positionRef.current = -streamerLength;
    });

    const stopAnimation = useMemoizedFn(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = undefined;
        }
        if (intervalTimerRef.current) {
            clearTimeout(intervalTimerRef.current);
            intervalTimerRef.current = undefined;
        }
        setIsRunning(false);
        setIsPaused(false);
    });

    const pauseAnimation = useMemoizedFn(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = undefined;
        }
        setIsPaused(true);
    });

    const startAnimation = useMemoizedFn(() => {
        if (isPaused) {
            setIsPaused(false);
            return;
        }
        setIsRunning(true);
        setIsPaused(false);
        resetAnimation();
        currentRunRef.current = 0;
    });

    const api: StreamerApi = useMemo(
        () => ({ start: startAnimation, stop: stopAnimation, pause: pauseAnimation }),
        [],
    );

    useEffect(() => {
        if (onCreationRef.current) {
            onCreationRef.current(api);
        }
    }, [api]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !pathData.segments.length) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!isRunning || isPaused) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const drawTrack = () => {
            if (!track.visible) return;
            ctx.beginPath();
            ctx.moveTo(pathData.segments[0].start.x, pathData.segments[0].start.y);
            for (const seg of pathData.segments) {
                ctx.lineTo(seg.end.x, seg.end.y);
            }
            ctx.strokeStyle = track.color ?? 'rgba(255,255,255,0.2)';
            ctx.lineWidth = track.width ?? 1;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            drawTrack();

            positionRef.current += speed;

            if (positionRef.current > pathData.totalLength + streamerLength) {
                currentRunRef.current += 1;
                onAnimationCompleteRef.current?.();

                const runCount = props.runCount ?? DEFAULT_RUN_COUNT;
                if (runCount > 0 && currentRunRef.current >= runCount) {
                    stopAnimation();
                    return;
                }

                if (interval > 0) {
                    pauseAnimation();
                    intervalTimerRef.current = window.setTimeout(() => {
                        resetAnimation();
                        setIsPaused(false);
                    }, interval);
                    return;
                }

                resetAnimation();
            }

            for (let i = 0; i < steps; i++) {
                const ratio = i / steps;
                const currentDist = positionRef.current - (1 - ratio) * streamerLength;
                const nextDist = positionRef.current - (1 - (ratio + 1 / steps)) * streamerLength;

                const p1 = getPointAtDistance(pathData.segments, pathData.totalLength, currentDist);
                const p2 = getPointAtDistance(pathData.segments, pathData.totalLength, nextDist);

                if (p1 && p2) {
                    const color = d3Interpolate(colors.tail, colors.head)(ratio);
                    const currentWidth = lineWidth.tail + ratio * (lineWidth.head - lineWidth.tail);
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = currentWidth;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            stopAnimation();
        };
    }, [
        pathData,
        streamerLength,
        speed,
        steps,
        colors,
        lineWidth,
        track,
        isRunning,
        isPaused,
        interval,
        props.runCount,
    ]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = width;
            canvas.height = height;
        }
    }, [width, height]);

    return (
        <StreamerPathContainer
            ref={containerRef}
            width={props.width}
            height={props.height}
            className={props.className}
            style={props.style}
        >
            <canvas ref={canvasRef} />
        </StreamerPathContainer>
    );
};

export type { StreamerApi };
export { StreamerPathContainer } from './Container';