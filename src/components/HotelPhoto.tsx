import Image from "next/image";

export function HotelPhoto({
  src,
  fallbackSrc,
  alt,
  className = "",
  sizes = "(max-width: 768px) 100vw, 33vw",
}: {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const shown = src || fallbackSrc || null;

  return (
    <div className={`relative overflow-hidden bg-sand ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-sea/15 via-sand to-navy/10" />
      {shown ? (
        <Image src={shown} alt={alt} fill className="object-cover" sizes={sizes} unoptimized />
      ) : (
        <span className="sr-only">{alt}</span>
      )}
    </div>
  );
}
