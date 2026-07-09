type LoaderProps = {
  size?: number;
  fullscreen?: boolean;
};

export function Loader({ size = 32, fullscreen }: LoaderProps) {
  return (
    <div className={'loader' + (fullscreen ? ' loader--full' : '')}>
      <span className="spinner" style={{ width: size, height: size }} />
    </div>
  );
}
