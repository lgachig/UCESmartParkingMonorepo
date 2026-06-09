'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./MapInner'), { ssr: false });

export default MapView;
