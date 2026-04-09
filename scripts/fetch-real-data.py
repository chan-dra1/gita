import requests
import json
import os

BASE_URL = "https://raw.githubusercontent.com/gita/gita/main/data"

def fetch_json(endpoint):
    print(f"Fetching {endpoint}...")
    response = requests.get(f"{BASE_URL}/{endpoint}")
    response.raise_for_status()
    return response.json()

def main():
    print("Starting data ingestion process...")
    
    # 1. Fetch raw data
    verses_raw = fetch_json("verse.json")
    commentary_raw = fetch_json("commentary.json")
    translation_raw = fetch_json("translation.json") # Just in case we want better translations
    
    # Paths to our local data
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    b_gita_path = os.path.join(project_root, 'src', 'data', 'bhagavad-gita.json')
    purports_path = os.path.join(project_root, 'src', 'data', 'purports.json')
    
    # 2. Load existing localized gita json (for structure)
    with open(b_gita_path, 'r', encoding='utf-8') as f:
        local_gita = json.load(f)
        
    # Maps for easy lookup
    # raw verse: id -> {word_meanings, ...}
    verse_map = { v['id']: v for v in verses_raw }
    
    # Build a lookup map from (chapter, verse) to verse_id
    cv_to_id = {}
    for v in verses_raw:
        cv_to_id[f"{v['chapter_number']}_{v['verse_number']}"] = v['id']

    # Organise purports (English, specifically Swami Sivananda id 16, else fallback to another english)
    purports_map = {} # "chap:verse" -> "purport text"
    
    for c in commentary_raw:
        if c.get('lang') == 'english':
            ch = c['verse_id'] # We need to map verse_id back to (chapter, verse)
            
            # Find chapter and verse based on verse_id
            v_match = verse_map.get(c['verse_id'])
            if not v_match:
                continue
                
            chap = v_match['chapter_number']
            vers = v_match['verse_number']
            key = f"{chap}:{vers}"
            
            p_text = c.get('description', '')
            if not p_text.strip():
                continue
            
            # Prefer Swami Sivananda
            if key not in purports_map:
                purports_map[key] = p_text
            elif c.get('author_id') == 16:
                purports_map[key] = p_text

    # 3. Update local gita structure with word meanings
    for idx, chapter in enumerate(local_gita['chapters']):
        cv = chapter['chapter']
        for v_idx, verse in enumerate(chapter['verses']):
            vv = verse['verse']
            
            v_id = cv_to_id.get(f"{cv}_{vv}")
            if v_id and v_id in verse_map:
                wm = verse_map[v_id].get('word_meanings', '')
                local_gita['chapters'][idx]['verses'][v_idx]['word_meanings'] = wm
            else:
                local_gita['chapters'][idx]['verses'][v_idx]['word_meanings'] = ""

    # Save bhagavad-gita.json
    print("Saving updated bhagavad-gita.json...")
    with open(b_gita_path, 'w', encoding='utf-8') as f:
        json.dump(local_gita, f, indent=2, ensure_ascii=False)

    # Save purports.json
    print(f"Saving purports.json ({len(purports_map)} purports generated)...")
    with open(purports_path, 'w', encoding='utf-8') as f:
        json.dump(purports_map, f, indent=2, ensure_ascii=False)

    print("Successfully ingested 700 verses of real data!")

if __name__ == "__main__":
    main()
