'use client';

import dynamic from 'next/dynamic';

const ZoneModalInner = dynamic(() => import('./ZoneModalInner'), { ssr: false });

export default ZoneModalInner;
