import os
import json
import time
import urllib.request
import re

API_KEY = "REMOVED_FOR_SECURITY"

workdir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
gita_file = os.path.join(workdir, 'src', 'data', 'bhagavad-gita.json')
map_file = os.path.join(workdir, 'src', 'utils', 'audioMap.ts')

sanskrit_dir = os.path.join(workdir, 'assets', 'audio', 'sanskrit')
english_dir = os.path.join(workdir, 'assets', 'audio', 'english')
hindi_dir = os.path.join(workdir, 'assets', 'audio', 'hindi')

os.makedirs(sanskrit_dir, exist_ok=True)
os.makedirs(english_dir, exist_ok=True)
os.makedirs(hindi_dir, exist_ok=True)

with open(gita_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

def clean_text(text):
    text = re.sub(r'^(chapter|verse|sloka)\s+\d+[,.]?\s*', '', text, flags=re.I)
    text = re.sub(r'Chapter \d+, Verse \d+[.,]?\s*', '', text, flags=re.I)
    text = text.replace(';', ',')
    text = re.sub(r'(\\|\|॥)[^\\|॥]*(\\|\|॥)', '', text)
    text = re.sub(r'\s{2,}', ' ', text)
    return text.strip()

def download_tts(text, voice, out_path):
    if os.path.exists(out_path):
        return True
    
    req = urllib.request.Request(
        'https://api.openai.com/v1/audio/speech',
        data=json.dumps({
            "model": "tts-1",
            "input": text,
            "voice": voice,
            "response_format": "mp3",
            "speed": 0.9 if voice == 'nova' else 0.85
        }).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp, open(out_path, 'wb') as out_file:
            out_file.write(resp.read())
        return True
    except Exception as e:
        print(f"Error downloading {out_path}: {e}")
        return False

# Initialize the queue
queue = []
for chapter in data['chapters']:
    for verse in chapter['verses']:
        c = chapter['chapter']
        v = verse['verse']
        
        # Sanskrit
        queue.append({
            'key': f"sanskrit_{c}_{v}",
            'text': clean_text(verse['sanskrit']),
            'voice': 'alloy',
            'path': os.path.join(sanskrit_dir, f"{c}_{v}.mp3"),
            'rel_path': f"../../assets/audio/sanskrit/{c}_{v}.mp3"
        })
        
        # English
        queue.append({
            'key': f"english_{c}_{v}",
            'text': clean_text(verse['translation_english']),
            'voice': 'nova',
            'path': os.path.join(english_dir, f"{c}_{v}.mp3"),
            'rel_path': f"../../assets/audio/english/{c}_{v}.mp3"
        })

print(f"Starting download of {len(queue)} files...")

# Overwrite audioMap.ts to start clean, then append to it
with open(map_file, 'w', encoding='utf-8') as f:
    f.write('export const audioMap: Record<string, any> = {\n')

success_keys = []

for i, item in enumerate(queue):
    print(f"[{i+1}/{len(queue)}] {item['key']}")
    if download_tts(item['text'], item['voice'], item['path']):
        success_keys.append(f"  '{item['key']}': require('{item['rel_path']}'),")
        
        # Re-write the map file frequently so App always works
        if i % 10 == 0:
            with open(map_file, 'w', encoding='utf-8') as f:
                f.write('export const audioMap: Record<string, any> = {\n')
                for line in success_keys:
                    f.write(line + '\n')
                f.write('};\n')
                
    time.sleep(1.2) # ~40-50 RPM, perfectly safe for tier 1

# Final write
with open(map_file, 'w', encoding='utf-8') as f:
    f.write('export const audioMap: Record<string, any> = {\n')
    for line in success_keys:
        f.write(line + '\n')
    f.write('};\n')

print("Finished fully caching audio!")
