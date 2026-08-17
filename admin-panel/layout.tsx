import type { ReactNode } from "react";
import "./styles.css";

const navItems = [
  ["Dashboard", "/dashboard"],
  ["Users", "/users"],
  ["Bloggers", "/bloggers"],
  ["Makeup Library", "/makeup-library"],
  ["Prompt Manager", "/prompt-manager"],
  ["Content", "/content"],
  ["Orders", "/orders"],
];

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <aside className="admin-sidebar">
          <strong>{"\u7f8e\u4e3d\u589e\u957f\u540e\u53f0"}</strong>
          <nav>
            {navItems.map(([label, href]) => (
              <a href={href} key={href}>
                {label}
              </a>
            ))}
          </nav>
        </aside>
        {children}
      </body>
    </html>
  );
}
