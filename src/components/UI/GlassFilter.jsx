import React from "react";

export const GlassFilter = () => {
    return (
        <svg className="hidden fixed width-0 height-0 aria-hidden">  
            <defs>
                <filter id="glass-surface-noise">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.8"
                        numOctaves="3"
                        stitchTiles="stitch"
                    />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
            </defs>
        </svg>
    );
};