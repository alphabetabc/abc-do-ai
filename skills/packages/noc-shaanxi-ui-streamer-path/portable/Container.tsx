import { forwardRef, CSSProperties } from 'react';

export interface StreamerPathContainerProps {
    width?: number;
    height?: number;
    className?: string;
    style?: CSSProperties;
    children?: React.ReactNode;
}

/**
 * Portable container — pure inline-style, no styled-components.
 * Forwards the ref so the parent can measure the DOM box.
 */
export const StreamerPathContainer = forwardRef<HTMLDivElement, StreamerPathContainerProps>(
    ({ width, height, className, style, children }, ref) => {
        const composedStyle: CSSProperties = {
            position: 'relative',
            width: width !== undefined ? `${width}px` : '100%',
            height: height !== undefined ? `${height}px` : '100%',
            ...style,
        };

        const canvasStyle: CSSProperties = {
            position: 'absolute',
            top: 0,
            left: 0,
        };

        return (
            <div ref={ref} className={className} style={composedStyle}>
                <div style={canvasStyle}>{children}</div>
            </div>
        );
    },
);

StreamerPathContainer.displayName = 'StreamerPathContainer';