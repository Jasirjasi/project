import React from 'react';

export const CornerDecoration = ({ className = "" }) => (
    <div className={`traditional-corner ${className}`}>
        <svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 10V40C10 40 10 50 20 50C30 50 30 40 30 40V20C30 20 30 10 40 10C50 10 60 10 70 10" stroke="var(--color-accent)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            <path d="M15 15V35C15 35 15 42 22 42C29 42 29 35 29 35V22C29 22 29 15 36 15C43 15 50 15 57 15" stroke="var(--color-accent)" strokeWidth="0.5" strokeLinecap="round" opacity="0.4" />
            <circle cx="20" cy="20" r="2" fill="var(--color-accent)" opacity="0.8" />
            <circle cx="45" cy="15" r="1.5" fill="var(--color-accent)" opacity="0.5" />
            <circle cx="15" cy="45" r="1.5" fill="var(--color-accent)" opacity="0.5" />
        </svg>
    </div>
);

export const MandalaDecoration = ({ className = "" }) => (
    <div className={`traditional-mandala ${className}`}>
        <svg width="200" height="200" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.15">
            <circle cx="50" cy="50" r="45" stroke="var(--color-accent)" strokeWidth="0.5" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="35" stroke="var(--color-accent)" strokeWidth="0.5" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                <g key={deg} transform={`rotate(${deg} 50 50)`}>
                    <path d="M50 5 L55 20 L50 25 L45 20 Z" fill="var(--color-accent)" />
                    <path d="M50 25 L58 40 L50 45 L42 40 Z" stroke="var(--color-accent)" strokeWidth="0.5" />
                </g>
            ))}
            <circle cx="50" cy="50" r="5" fill="var(--color-accent)" />
        </svg>
    </div>
);
