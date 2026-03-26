declare module "react-simple-maps" {
    import * as React from "react";

    export interface ComposableMapProps {
        projection?: string | Function;
        projectionConfig?: object;
        width?: number;
        height?: number;
        children?: React.ReactNode;
        className?: string;
    }

    export interface GeographiesProps {
        geography: string | object | string[];
        children: (props: { geographies: any[] }) => React.ReactNode;
    }

    export interface GeographyProps {
        geography: any;
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        style?: {
            default?: React.CSSProperties;
            hover?: React.CSSProperties;
            pressed?: React.CSSProperties;
        };
        onMouseEnter?: React.MouseEventHandler;
        onMouseLeave?: React.MouseEventHandler;
    }

    export interface ZoomableGroupProps {
        center?: [number, number];
        zoom?: number;
        minZoom?: number;
        maxZoom?: number;
        onMoveStart?: Function;
        onMoveEnd?: Function;
        children?: React.ReactNode;
    }

    export const ComposableMap: React.FC<ComposableMapProps>;
    export const Geographies: React.FC<GeographiesProps>;
    export const Geography: React.FC<GeographyProps>;
    export const ZoomableGroup: React.FC<ZoomableGroupProps>;
    export const Marker: React.FC<any>;
    export const Annotation: React.FC<any>;
    export const Line: React.FC<any>;
}