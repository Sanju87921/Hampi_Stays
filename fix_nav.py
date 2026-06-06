import sys

path = 'frontend/src/components/layout/Navbar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import re

new_content = re.sub(
    r": \[\n\s*\{ name: t\(\"navbar\.resorts\".*?\];",
    r": user?.role?.toUpperCase() === 'ADMIN' ? [] : [\n  { name: t(\"navbar.resorts\", \"Resorts\"), path: \"/resorts\" },\n  { name: t(\"navbar.discover\", \"Discover\"), path: \"/discovery\" },\n  ...(user && user.role?.toUpperCase() !== 'ADMIN' ? [{ name: t(\"navbar.dashboard\", \"Dashboard\"), path: \"/dashboard\" }] : []),\n  ];",
    content,
    flags=re.DOTALL
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
