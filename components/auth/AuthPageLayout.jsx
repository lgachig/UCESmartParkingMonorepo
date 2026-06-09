/**
 * Wrapper for auth pages: animated background and optional blur orbs.
 */
export default function AuthPageLayout({ children, withOrbs = true }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center animated-bg p-4 relative overflow-hidden">
      {withOrbs && (
        <>
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#CC0000] rounded-full blur-[180px] opacity-20 animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#003366] rounded-full blur-[200px] opacity-30 animate-pulse delay-1000" />
        </>
      )}
      {children}
    </div>
  );
}
