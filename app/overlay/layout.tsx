/**
 * OBS browser source: the page must composite over the video, so it opts out
 * of the site's dark background and of scrolling.
 */
export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`html, body { background: transparent !important; overflow: hidden; }`}</style>
      {children}
    </>
  );
}
