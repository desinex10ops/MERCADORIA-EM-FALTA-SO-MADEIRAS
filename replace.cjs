const fs = require('fs');
const files = ['src/pages/SellerPanel.jsx', 'src/pages/ProductsCatalog.jsx', 'src/pages/Login.jsx', 'src/pages/History.jsx', 'src/pages/BuyerDashboard.jsx'];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/background: 'rgba\\(0,0,0,0\\.2\\)'/g, "background: 'var(--input-bg)'");
  content = content.replace(/background: 'rgba\\(255,255,255,0\\.1\\)'/g, "background: 'var(--btn-glass-bg)'");
  content = content.replace(/background: 'rgba\\(0,0,0,0\\.15\\)'/g, "background: 'var(--btn-glass-bg)'");
  // Only replace `color: 'white'` if it is an input/select/textarea border/color combination or text that changes
  // Let's replace specifically inside input/select/textarea styles
  content = content.replace(/color: 'white'/g, "color: 'var(--text-primary)'");
  // However, we want to keep `color: 'white'` for action buttons with colored backgrounds!
  // E.g., background: 'var(--accent-blue)', color: 'var(--text-primary)' should be 'white'
  content = content.replace(/background: 'var\\(--accent-blue\\)', color: 'var\\(--text-primary\\)'/g, "background: 'var(--accent-blue)', color: 'white'");
  content = content.replace(/background: 'var\\(--status-green\\)', color: 'var\\(--text-primary\\)'/g, "background: 'var(--status-green)', color: 'white'");
  content = content.replace(/background: 'var\\(--status-red\\)', color: 'var\\(--text-primary\\)'/g, "background: 'var(--status-red)', color: 'white'");
  content = content.replace(/background: '#25D366', color: 'var\\(--text-primary\\)'/g, "background: '#25D366', color: 'white'");
  fs.writeFileSync(f, content);
});

// Layout.jsx update
let layout = fs.readFileSync('src/components/Layout.jsx', 'utf8');
if (!layout.includes('const [theme')) {
  layout = layout.replace(
    /import { LogOut, LayoutDashboard, Fullscreen, History, PackagePlus, Lock, X, List, ArrowUp } from 'lucide-react';/,
    "import { LogOut, LayoutDashboard, Fullscreen, History, PackagePlus, Lock, X, List, ArrowUp, Sun, Moon } from 'lucide-react';"
  );
  layout = layout.replace(
    /const isVendedor = user\?.role === 'vendedor';/,
    `const isVendedor = user?.role === 'vendedor';\n\n  const [theme, setTheme] = useState(localStorage.getItem('@MercadoriaData:theme') || 'dark');\n\n  useEffect(() => {\n    if (theme === 'light') {\n      document.body.classList.add('light-mode');\n    } else {\n      document.body.classList.remove('light-mode');\n    }\n    localStorage.setItem('@MercadoriaData:theme', theme);\n  }, [theme]);\n\n  const toggleTheme = () => {\n    setTheme(prev => prev === 'dark' ? 'light' : 'dark');\n  };`
  );
  layout = layout.replace(
    /<button onClick={\(\) => setShowPasswordModal\(true\)}/,
    `<button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} title="Alternar Tema">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>\n          <button onClick={() => setShowPasswordModal(true)}`
  );
  layout = layout.replace(/color: 'white'/g, "color: 'var(--text-primary)'");
  layout = layout.replace(/background: 'var\\(--accent-blue\\)',(\s+)color: 'var\\(--text-primary\\)'/g, "background: 'var(--accent-blue)',$1color: 'white'");
  layout = layout.replace(/color: isActive \? 'var\\(--text-primary\\)' : 'var\\(--text-secondary\\)'/g, "color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)'"); // Better active link color
  
  // Specific fix for ArrowUp button
  layout = layout.replace(/color: 'var\\(--text-primary\\)',\\n\\s+border: 'none',\\n\\s+borderRadius: '50%',/m, "color: 'white',\n            border: 'none',\n            borderRadius: '50%',");
  layout = layout.replace(
    /background: 'var\(--accent-blue\)',\n            color: 'var\(--text-primary\)',/g,
    "background: 'var(--accent-blue)',\n            color: 'white',"
  );

  fs.writeFileSync('src/components/Layout.jsx', layout);
}
