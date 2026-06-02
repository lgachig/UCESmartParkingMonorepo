import type { ReactNode } from 'react';

interface AuthPageLayoutProps {
  children: ReactNode;
  withOrbs?: boolean;
}

export function AuthPageLayout({
  children,
  withOrbs = true,
}: AuthPageLayoutProps) {
  return (
    <div className="animated-bg relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4">
      {withOrbs && (
        <>
          <div className="absolute top-[-10%] left-[-5%] h-[500px] w-[500px] animate-pulse rounded-full bg-[#CC0000] opacity-20 blur-[180px]" />
          <div className="absolute right-[-5%] bottom-[-10%] h-[600px] w-[600px] animate-pulse rounded-full bg-[#003366] opacity-30 blur-[200px]" />
        </>
      )}
      {children}
    </div>
  );
}
