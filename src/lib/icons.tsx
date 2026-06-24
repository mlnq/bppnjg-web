export const ICONS: Record<string, string> = {
  home: '<path d="M3 9.6 12 3l9 6.6V20a1 1 0 0 1-1 1h-5v-6.5H9V21H4a1 1 0 0 1-1-1z"/>',
  map: '<path d="m9 4-6 2.4v14.2L9 18.6l6 2.4 6-2.4V4.4L15 6.4 9 4Z"/><path d="M9 4v14.6"/><path d="M15 6.4V21"/>',
  route: '<circle cx="6" cy="19" r="2.4"/><circle cx="18" cy="5" r="2.4"/><path d="M8.4 19H15a3.4 3.4 0 0 0 0-6.8H9a3.4 3.4 0 0 1 0-6.8h6.6"/>',
  'book-open': '<path d="M12 7.2v13.3"/><path d="M3 18.2a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v12.6a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  message: '<path d="M21 14.5a2 2 0 0 1-2 2H8l-4.5 3.6V5.5a2 2 0 0 1 2-2h13.5a2 2 0 0 1 2 2z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 3.6 1.65 1.65 0 0 0 9 2.09V2a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 14 3.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.4 8v.09a1.65 1.65 0 0 0 1.51 1H22a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  'book-heart': '<path d="M16 8.1a2.1 2.1 0 0 0-2.1-2.1c-.8 0-1.4.3-1.9.9-.5-.6-1.1-.9-1.9-.9A2.1 2.1 0 0 0 8 8.1c0 .6.3 1.2.7 1.6L12 13l3.3-3.3c.4-.4.7-1 .7-1.6z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  church: '<path d="M10 9h4"/><path d="M12 7v5"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="M18 22V5.6a1 1 0 0 0-.55-.9l-4.55-2.27a2 2 0 0 0-1.8 0L6.55 4.7a1 1 0 0 0-.55.9V22"/><path d="m18 7 3.45 1.72a1 1 0 0 1 .55.9V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.62a1 1 0 0 1 .55-.9L6 7"/>',
  'map-pin': '<path d="M20 10c0 4.99-5.54 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.2 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  locate: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',
  footprints: '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>',
  timer: '<path d="M10 2h4"/><path d="M12 14v-4"/><circle cx="12" cy="14" r="8"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4.5"/><path d="M12 16h.01"/>',
  bed: '<path d="M2 4v16"/><path d="M2 9h18a2 2 0 0 1 2 2v9"/><path d="M2 17h20"/><path d="M6 9v8"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  'cloud-sun': '<path d="M12 2v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="M2 13h2"/><path d="M20 13h2"/><path d="m19.1 4.9-1.4 1.4"/><path d="M8 13a4 4 0 1 1 7.4-2"/><path d="M13 22H7a4 4 0 0 1 0-8 5 5 0 0 1 9.7-1.6A3.5 3.5 0 1 1 18 22z"/>',
  wind: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  thermometer: '<path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
  flag: '<path d="M4 15s1-.8 4-.8 5 1.6 8 1.6 4-.8 4-.8V3.2s-1 .8-4 .8-5-1.6-8-1.6-4 .8-4 .8z"/><path d="M4 22V3.2"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  bell: '<path d="M10.3 21a2 2 0 0 0 3.4 0"/><path d="M3.3 15.3A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.4 14 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.4 6-2.7 7.3"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  coffee: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6.7a2 2 0 0 0 .6 1.4l1.8 1.8a1 1 0 0 1-.7 1.7H7.3a1 1 0 0 1-.7-1.7l1.8-1.8a2 2 0 0 0 .6-1.4Z"/>',
  cross: '<path d="M12 3v18"/><path d="M7 8h10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="5" width="18" height="17" rx="2"/><path d="M3 10h18"/>',
  type: '<path d="M4 7V5h16v2"/><path d="M9 19h6"/><path d="M12 5v14"/>',
  text: '<path d="M5 6h14"/><path d="M5 12h14"/><path d="M5 18h8"/>',
  'chevrons-up-down': '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
  navigation: '<path d="M12 2 19 21l-7-4-7 4z"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
};

type IconProps = {
  name: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

export function Icon({ name, size, className = '', style }: IconProps) {
  const inner = ICONS[name] ?? '';
  return (
    <span className={'ic ' + className} style={{ fontSize: size, ...style }} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeLinecap="round" strokeLinejoin="round"
           dangerouslySetInnerHTML={{ __html: inner }} />
    </span>
  );
}
