type SectionHeadProps = {
  children: React.ReactNode;
  link?: string;
  onLink?: () => void;
};

export function SectionHead({ children, link, onLink }: SectionHeadProps) {
  return (
    <div className="sec">
      <h2 className="sec__h">{children}</h2>
      {link && <button className="sec__link" onClick={onLink}>{link}</button>}
    </div>
  );
}
