#!/usr/bin/env python3
"""
Generate authentic spiritual chanting audio for Bhagavad Gita verses
using Google Gemini's TTS capabilities.

Usage:
  python3 scripts/generate_spiritual_audio.py --chapter 1

This script generates:
  1. Sanskrit chanting (meditative tone) -> assets/audio/sanskrit/{ch}_{v}.mp3
  2. English meaning narration (spiritual tone) -> assets/audio/english/{ch}_{v}.mp3
"""

import os
import sys
import json
import time
import argparse
import struct
import io

# Try to import google.genai
try:
    from google import genai
    from google.genai import types
except ImportError:
    print("ERROR: google-genai package not installed.")
    print("Run: pip install google-genai")
    sys.exit(1)

# ─── Config ──────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_FILE = os.path.join(PROJECT_DIR, "src", "data", "bhagavad-gita.json")
SANSKRIT_OUT = os.path.join(PROJECT_DIR, "assets", "audio", "sanskrit")
ENGLISH_OUT = os.path.join(PROJECT_DIR, "assets", "audio", "english")

# Gemini model for TTS
TTS_MODEL = "gemini-2.5-flash-preview-tts"

# Rate limiting
DELAY_BETWEEN_REQUESTS = 2  # seconds


def load_chapter_data(chapter_num: int) -> dict:
    """Load verse data for a specific chapter."""
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    for ch in data["chapters"]:
        if ch["chapter"] == chapter_num:
            return ch

    raise ValueError(f"Chapter {chapter_num} not found in data file.")


def clean_sanskrit(text: str) -> str:
    """Clean Sanskrit text for chanting - remove verse numbers and pipes."""
    import re
    text = re.sub(r'\|\|[\d\-]+\|\|', '', text)
    text = re.sub(r'\|+', '', text)
    text = text.replace('\\n', '\n')
    return text.strip()


def clean_english(text: str) -> str:
    """Clean English text for narration."""
    import re
    text = re.sub(r'^[\d.]+\s*', '', text)
    text = re.sub(r'Chapter \d+, Verse \d+[.,]?\s*', '', text, flags=re.IGNORECASE)
    text = text.replace('"', '').replace('"', '').replace('"', '')
    return text.strip()


def convert_pcm_to_wav(pcm_data: bytes, sample_rate: int = 24000, channels: int = 1, sample_width: int = 2) -> bytes:
    """Convert raw PCM data to WAV format."""
    wav_buffer = io.BytesIO()
    
    # WAV header
    data_size = len(pcm_data)
    wav_buffer.write(b'RIFF')
    wav_buffer.write(struct.pack('<I', 36 + data_size))
    wav_buffer.write(b'WAVE')
    wav_buffer.write(b'fmt ')
    wav_buffer.write(struct.pack('<I', 16))  # chunk size
    wav_buffer.write(struct.pack('<H', 1))   # PCM format
    wav_buffer.write(struct.pack('<H', channels))
    wav_buffer.write(struct.pack('<I', sample_rate))
    wav_buffer.write(struct.pack('<I', sample_rate * channels * sample_width))  # byte rate
    wav_buffer.write(struct.pack('<H', channels * sample_width))  # block align
    wav_buffer.write(struct.pack('<H', sample_width * 8))  # bits per sample
    wav_buffer.write(b'data')
    wav_buffer.write(struct.pack('<I', data_size))
    wav_buffer.write(pcm_data)
    
    return wav_buffer.getvalue()


def wav_to_mp3(wav_data: bytes, output_path: str):
    """Convert WAV data to MP3 using ffmpeg or just save as WAV if ffmpeg unavailable."""
    import subprocess
    import tempfile
    
    # Write WAV to temp file
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_wav:
        tmp_wav.write(wav_data)
        tmp_wav_path = tmp_wav.name
    
    try:
        # Try ffmpeg conversion
        result = subprocess.run(
            ['ffmpeg', '-y', '-i', tmp_wav_path, '-codec:a', 'libmp3lame', '-qscale:a', '4', output_path],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg failed: {result.stderr}")
    except (FileNotFoundError, RuntimeError):
        # Fallback: save as WAV with .mp3 extension (expo-av handles both)
        print("    ⚠️  ffmpeg not found, saving as WAV (compatible with expo-av)")
        with open(output_path, 'wb') as f:
            f.write(wav_data)
    finally:
        os.unlink(tmp_wav_path)


def generate_audio(client, text: str, voice_name: str, output_path: str, style_prompt: str = "", retries: int = 3):
    """Generate audio using Gemini TTS and save to file with retries."""
    
    full_prompt = f"{style_prompt}\n\n{text}" if style_prompt else text
    
    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model=TTS_MODEL,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=voice_name,
                            )
                        )
                    ),
                ),
            )
            
            # Extract audio data
            if not response.candidates or not response.candidates[0].content.parts:
                print(f"    ⚠️ Warning: Empty response from Gemini (Attempt {attempt+1}/{retries})")
                time.sleep(DELAY_BETWEEN_REQUESTS * 2)
                continue
                
            audio_data = response.candidates[0].content.parts[0].inline_data.data
            mime_type = response.candidates[0].content.parts[0].inline_data.mime_type
            
            # Gemini returns raw PCM audio at 24kHz
            if 'pcm' in mime_type.lower() or 'raw' in mime_type.lower() or 'L16' in mime_type:
                wav_data = convert_pcm_to_wav(audio_data, sample_rate=24000)
            else:
                # If it returns WAV or another format directly
                wav_data = audio_data
            
            # Convert to MP3
            wav_to_mp3(wav_data, output_path)
            
            return True
            
        except Exception as e:
            print(f"    ❌ Error: {e} (Attempt {attempt+1}/{retries})")
            time.sleep(DELAY_BETWEEN_REQUESTS * 2)
            
    return False


def main():
    parser = argparse.ArgumentParser(description="Generate spiritual chanting audio for Gita verses")
    parser.add_argument("--chapter", type=int, required=True, help="Chapter number to generate audio for")
    parser.add_argument("--start-verse", type=int, default=1, help="Starting verse (default: 1)")
    parser.add_argument("--end-verse", type=int, default=0, help="Ending verse (default: all)")
    parser.add_argument("--sanskrit-only", action="store_true", help="Generate only Sanskrit chanting")
    parser.add_argument("--english-only", action="store_true", help="Generate only English narration")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be generated without calling API")
    args = parser.parse_args()

    # Load API key from .env
    env_path = os.path.join(PROJECT_DIR, ".env")
    api_key = None
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("EXPO_PUBLIC_GEMINI_API_KEY="):
                    api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
    
    if not api_key:
        print("ERROR: No Gemini API key found in .env file.")
        print("Set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.")
        sys.exit(1)

    # Initialize client
    client = genai.Client(api_key=api_key)

    # Load data
    chapter_data = load_chapter_data(args.chapter)
    verses = chapter_data["verses"]
    
    end_verse = args.end_verse if args.end_verse > 0 else chapter_data["verses_count"]
    verses = [v for v in verses if args.start_verse <= v["verse"] <= end_verse]

    print(f"\n🕉️  Generating spiritual audio for Chapter {args.chapter}")
    print(f"   Verses: {args.start_verse} to {end_verse} ({len(verses)} verses)")
    print(f"   Sanskrit: {'Yes' if not args.english_only else 'No'}")
    print(f"   English:  {'Yes' if not args.sanskrit_only else 'No'}")
    print()

    # Ensure output directories exist
    os.makedirs(SANSKRIT_OUT, exist_ok=True)
    os.makedirs(ENGLISH_OUT, exist_ok=True)

    # Style prompts
    sanskrit_style = (
        "Chant the following Sanskrit verse from the Bhagavad Gita in a slow, reverent, "
        "meditative tone. Use traditional Vedic chanting rhythm. "
        "Do NOT say any chapter or verse numbers. "
        "Just chant the sacred Sanskrit text with devotion and clarity."
    )

    english_style = (
        "Read the following English translation of a Bhagavad Gita verse in a calm, "
        "spiritual, and contemplative narration style. Speak slowly and clearly, "
        "as if guiding someone in deep meditation. "
        "Do NOT mention any chapter or verse numbers."
    )

    success_count = 0
    fail_count = 0
    
    for verse in verses:
        v_num = verse["verse"]
        sanskrit_text = clean_sanskrit(verse["sanskrit"])
        english_text = clean_english(verse["translation_english"])
        
        print(f"  📿 Chapter {args.chapter}, Verse {v_num}")
        
        if args.dry_run:
            print(f"      Sanskrit: {sanskrit_text[:60]}...")
            print(f"      English:  {english_text[:60]}...")
            continue

        # Generate Sanskrit chanting
        if not args.english_only:
            sanskrit_path = os.path.join(SANSKRIT_OUT, f"{args.chapter}_{v_num}.mp3")
            print(f"      🔊 Sanskrit chanting...", end=" ", flush=True)
            
            if generate_audio(client, sanskrit_text, "Kore", sanskrit_path, sanskrit_style):
                file_size = os.path.getsize(sanskrit_path)
                print(f"✅ ({file_size // 1024} KB)")
                success_count += 1
            else:
                fail_count += 1
            
            time.sleep(DELAY_BETWEEN_REQUESTS)

        # Generate English narration
        if not args.sanskrit_only:
            english_path = os.path.join(ENGLISH_OUT, f"{args.chapter}_{v_num}.mp3")
            print(f"      🔊 English narration...", end=" ", flush=True)
            
            if generate_audio(client, english_text, "Puck", english_path, english_style):
                file_size = os.path.getsize(english_path)
                print(f"✅ ({file_size // 1024} KB)")
                success_count += 1
            else:
                fail_count += 1
            
            time.sleep(DELAY_BETWEEN_REQUESTS)

    print(f"\n{'='*50}")
    print(f"  ✅ Successful: {success_count}")
    print(f"  ❌ Failed: {fail_count}")
    print(f"{'='*50}")
    
    if not args.dry_run:
        # Calculate total size
        total_size = 0
        for d in [SANSKRIT_OUT, ENGLISH_OUT]:
            for f in os.listdir(d):
                if f.startswith(f"{args.chapter}_"):
                    total_size += os.path.getsize(os.path.join(d, f))
        print(f"  💾 Total size for Chapter {args.chapter}: {total_size / (1024*1024):.1f} MB")


if __name__ == "__main__":
    main()
