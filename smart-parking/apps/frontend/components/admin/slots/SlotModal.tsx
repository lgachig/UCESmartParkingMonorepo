'use client';

import dynamic from 'next/dynamic';

const SlotModalInner = dynamic(() => import('./SlotModalInner'), { ssr: false });

export default SlotModalInner;
