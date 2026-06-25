type EyebrowProps = {
  children: React.ReactNode;
  wine?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function Eyebrow({ children, wine, className = '', style }: EyebrowProps) {
  return (
    <div className={'eyebrow ' + (wine ? 'eyebrow--wine ' : '') + className} style={style}>
      {children}
    </div>
  );
}
