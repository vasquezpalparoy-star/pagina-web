#!/usr/bin/env python3
"""Inserta traducción de interfaz sin tocar scripts, funciones ni bibliotecas PDF.

Uso: python3 inyectar-es.py <carpeta_compilada> <archivo_traduccion_js>
"""
from pathlib import Path
import os
import shutil
import sys

def main():
    if len(sys.argv) != 3:
        raise SystemExit("Uso: inyectar-es.py carpeta_compilada archivo_js")
    dist = Path(sys.argv[1]).resolve()
    translation = Path(sys.argv[2]).resolve()
    if not dist.is_dir() or not translation.is_file():
        raise SystemExit("No se encuentran los recursos de la copia original.")
    dest = dist / "_grafiplot_es" / "traduccion-interfaz.js"
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(translation, dest)
    documents = sorted(dist.rglob("*.html"))
    if not documents:
        raise SystemExit("No se encontraron HTML para insertar el idioma.")
    processed = 0
    for path in documents:
        if "_grafiplot_es" in path.parts:
            continue
        html = path.read_text(encoding="utf-8")
        relative = os.path.relpath(dest, path.parent).replace(os.sep, "/")
        if not relative.startswith("."):
            relative = "./" + relative
        tag = '<script defer src="' + relative + '"></script>'
        if '_grafiplot_es/traduccion-interfaz.js' in html:
            continue
        if "</body>" not in html.lower():
            print("HTML sin body; no alterado:", path)
            continue
        import re
        html = re.sub(r"</body>", lambda _: tag + "\n</body>", html, count=1, flags=re.I)
        html = re.sub(r'<html\b([^>]*)\blang="en"', r'<html\1lang="es"', html, count=1, flags=re.I)
        path.write_text(html, encoding="utf-8")
        processed += 1
    if not processed:
        raise SystemExit("No se pudo aplicar la traducción a ningún HTML.")
    print(f"Traductor agregado a {processed} páginas HTML; lógica de PDF intacta.")

if __name__ == "__main__":
    main()
