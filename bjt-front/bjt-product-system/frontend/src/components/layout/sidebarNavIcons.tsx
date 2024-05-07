import React from 'react';
import classNames from 'classnames';

/**
 * 侧栏图标 — 与图一一致：实心剪影 / 圆+白标 / 线框人像等（尺寸仍由 `.sidebar-nav-icon-svg` 控制）。
 */
const SvgShell: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => (
  <span className={classNames('sidebar-nav-icon-svg', className)} aria-hidden>
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  </span>
);

/** 图一：实心黑色剪影风；选中态由侧栏把 currentColor 提白 */
export const NavIconHome: React.FC = () => (
  <SvgShell>
    <path
      fill="currentColor"
      d="M11.3 3.35L4.65 8.65c-.35.28-.55.7-.55 1.15V19.5c0 .83.67 1.5 1.5 1.5H9v-6.25c0-.55.45-1 1-1h4c.55 0 1 .45 1 1V21h3.4c.83 0 1.5-.67 1.5-1.5V9.8c0-.45-.2-.87-.55-1.15l-6.65-5.3a1.49 1.49 0 00-1.9 0z"
    />
  </SvgShell>
);

/** 图一：气垫枕长条轮廓 */
export const NavIconAirCushion: React.FC = () => (
  <SvgShell>
    <path
      fill="currentColor"
      d="M7.25 9.25h9.5c1.52 0 2.75 1.16 2.75 2.6v1.3c0 1.44-1.23 2.6-2.75 2.6h-9.5C5.73 15.75 4.5 14.59 4.5 13.15v-1.3c0-1.44 1.23-2.6 2.75-2.6z"
    />
  </SvgShell>
);

/** 图一：纸卷侧视剪影 */
export const NavIconPaper: React.FC = () => (
  <SvgShell>
    <path
      fill="currentColor"
      d="M8.75 5.25h5.25c2.07 0 3.75 1.57 3.75 3.5v7c0 .55-.45 1-1 1h-9.5a3.25 3.25 0 01-3.25-3.25V8.75c0-1.94 1.68-3.5 3.75-3.5zm1.5 3a1.15 1.15 0 100 2.3 1.15 1.15 0 000-2.3z"
    />
  </SvgShell>
);

/** 图一：胶带机 + 水滴 */
export const NavIconWaterTape: React.FC = () => (
  <SvgShell>
    <path
      fill="currentColor"
      d="M5.2 8.4h11.6c.72 0 1.3.58 1.3 1.3v6.6c0 .72-.58 1.3-1.3 1.3H5.2a1.3 1.3 0 01-1.3-1.3V9.7c0-.72.58-1.3 1.3-1.3z"
    />
    <circle fill="currentColor" cx="8.85" cy="12" r="2.35" />
    <path
      fill="currentColor"
      d="M17.35 6.45a1.45 1.45 0 011.25 2.55c-.55.32-1.25.05-1.5-.55a1.1 1.1 0 01-.9.55c-.9 0-1.35-1.05-.65-1.65a2.85 2.85 0 012.8-.9z"
    />
  </SvgShell>
);

/** 图一：方形容器内三条竖向气柱（白条在深色块上；选中态整图标变白可辨） */
export const NavIconAirColumn: React.FC = () => (
  <SvgShell className="sidebar-nav-icon--aircol">
    <rect className="sidebar-nav-icon--aircol-frame" x="4.25" y="4.25" width="15.5" height="15.5" rx="2" fill="currentColor" />
    <rect x="6.4" y="6.5" width="2.35" height="11" rx="0.5" className="sidebar-nav-icon--aircol-stripe" fill="#fff" />
    <rect x="10.85" y="6.5" width="2.35" height="11" rx="0.5" className="sidebar-nav-icon--aircol-stripe" fill="#fff" />
    <rect x="15.3" y="6.5" width="2.35" height="11" rx="0.5" className="sidebar-nav-icon--aircol-stripe" fill="#fff" />
  </SvgShell>
);

/** 图一：实心圆 + 白色叹号（未选中时为黑圆） */
export const NavIconSupport: React.FC = () => (
  <SvgShell>
    <circle cx="12" cy="12" r="8.65" fill="currentColor" />
    <path fill="none" stroke="#fff" strokeWidth="1.85" strokeLinecap="round" d="M12 8.55v.02M12 10.95V16.1" />
    <circle cx="12" cy="17.35" r="1.05" fill="#fff" />
  </SvgShell>
);

/** 图一：.contact 人像轮廓 + 圆形描边 */
export const NavIconContact: React.FC = () => (
  <SvgShell>
    <circle cx="12" cy="12" r="8.65" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="9.7" r="2.35" fill="currentColor" />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      d="M7.15 18.1c.85-2.05 2.65-3.35 4.85-3.35s4 1.3 4.85 3.35"
    />
  </SvgShell>
);
