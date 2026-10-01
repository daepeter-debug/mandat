/** Cover art sets the world; the playable map always renders the saved town. */
export default function RepublicCover({ eager = false }: { eager?: boolean }) {
  // A native image keeps the same static asset paths in Vite and Workers.
  // eslint-disable-next-line @next/next/no-img-element
  return <img
    className="republic-cover"
    src="/images/games/republic-cover-v2.webp"
    srcSet="/images/games/republic-cover-v2-small.webp 720w, /images/games/republic-cover-v2.webp 1440w"
    sizes="(max-width: 760px) 100vw, (max-width: 1050px) 50vw, 640px"
    width={1440} height={960} alt=""
    loading={eager ? "eager" : "lazy"}
    fetchPriority={eager ? "high" : "auto"}
    decoding="async"
  />;
}
