from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil
import re
import base64
import json
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
DIST.mkdir(exist_ok=True)
MAJOR = json.loads((ROOT / 'package.json').read_text())['version'].split('.')[0]
BASENAME = 'amber-keep-v' + MAJOR
ASSETS = ['buildings.png', 'details.png', 'terrain.webp', 'key-art.webp', 'workers.webp', 'soldiers.webp', 'advanced.webp']
PUBLISH_ASSETS = {'icon-512.png', 'cover-800x470.png', 'screenshot-desktop.png', 'screenshot-mobile.png', 'v8-settlement.png', 'v8-mobile.png', 'v8-bridge.png', 'v8-rain.png', 'v8-convoy.png', 'v8-mobile-economy.png'}
GAME_FILES = [ROOT / 'index.html', ROOT / 'style.css', ROOT / 'assets/icon.svg', *[ROOT / 'assets' / name for name in ASSETS], *sorted((ROOT / 'src').glob('*.js'))]

def release_script(code):
    return '\n'.join(line for line in code.splitlines() if not line.startswith("if(new URLSearchParams(location.search).has('test'))"))

standalone = (ROOT / 'index.html').read_text()
standalone = standalone.replace('<link rel="stylesheet" href="style.css">', '<style>' + (ROOT / 'style.css').read_text() + '</style>')
standalone = standalone.replace('href="assets/icon.svg"', 'href="data:image/svg+xml,' + quote((ROOT / 'assets/icon.svg').read_text()) + '"')
scripts = []
for name in ('content', 'engine', 'render', 'platform', 'i18n', 'app'):
    code = (ROOT / 'src' / (name + '.js')).read_text()
    code = re.sub(r'^import [^\n]*\n', '', code, flags=re.M)
    code = re.sub(r'\bexport\s+', '', code)
    scripts.append(release_script(code))
standalone = standalone.replace('<script type="module" src="src/app.js"></script>', '<script type="module">' + '\n'.join(scripts) + '</script>')
for asset in ASSETS:
    encoded = base64.b64encode((ROOT / 'assets' / asset).read_bytes()).decode()
    mime = 'image/webp' if asset.endswith('.webp') else 'image/png'
    standalone = standalone.replace('assets/' + asset, 'data:' + mime + ';base64,' + encoded)
play_file = DIST / f'{BASENAME}-play.html'
play_file.write_text(standalone)
game_zip = DIST / f'{BASENAME}-yandex.zip'
with ZipFile(game_zip, 'w', ZIP_DEFLATED) as archive:
    for path in GAME_FILES:
        content = path.read_bytes()
        if path.name == 'app.js':
            content = release_script(path.read_text())
        archive.writestr(str(path.relative_to(ROOT)), content)
with ZipFile(game_zip) as archive:
    assert 'index.html' in archive.namelist()
    assert '__amber' not in archive.read('src/app.js').decode()
    assert archive.testzip() is None
kit_zip = DIST / f'{BASENAME}-source-and-publishing.zip'
with ZipFile(kit_zip, 'w', ZIP_DEFLATED) as archive:
    for path in sorted(ROOT.rglob('*')):
        if not path.is_file():
            continue
        relative = path.relative_to(ROOT)
        if any(part in {'node_modules', 'dist', 'test-results', '.git', 'playwright-report', '__pycache__'} for part in relative.parts):
            continue
        if relative.parts[0] == 'publishing' and path.suffix in {'.png', '.webm'} and path.name not in PUBLISH_ASSETS:
            continue
        if relative.parts[:2] == ('publishing', 'video'):
            continue
        if str(relative).startswith('assets/') and path.suffix in {'.png', '.webp'} and path.name not in ASSETS:
            continue
        archive.write(path, str(relative))
    archive.write(play_file, f'standalone/{BASENAME}-play.html')
shutil.copy2(play_file, DIST / 'amber-keep-play.html')
shutil.copy2(game_zip, DIST / 'amber-keep-yandex.zip')
shutil.copy2(kit_zip, DIST / 'amber-keep-source-and-publishing.zip')
print(f'Game: {game_zip} ({game_zip.stat().st_size:,} bytes)')
print(f'Sources and publishing kit: {kit_zip} ({kit_zip.stat().st_size:,} bytes)')
print(f'Offline game: {play_file} ({play_file.stat().st_size:,} bytes)')
shutil.copy2(ROOT / 'README.md', DIST / 'amber-keep-instructions.md')
for name in ('screenshot-desktop.png', 'cover-800x470.png', 'icon-512.png', 'v8-settlement.png', 'v8-mobile.png', 'v8-bridge.png', 'v8-rain.png', 'v8-convoy.png'):
    source = ROOT / 'publishing' / name
    if source.exists():
        shutil.copy2(source, DIST / name)
