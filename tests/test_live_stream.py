"""
Live HTTP SSE Streaming verification test for FastAPI server.
"""

import json
import urllib.request
import sys

def test_stream(model_choice="groq-120b"):
    url = "http://127.0.0.1:8000/api/generate/stream"
    payload = {
        "text": "Deep dive tutorial on building custom AI agents in Python with tool calling and memory persistence.",
        "model": model_choice
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    print(f"\n==========================================")
    print(f"Connecting to live SSE stream (model={model_choice})...")
    print(f"==========================================")

    token_chunks = 0
    tags_received = []
    final_result = None

    with urllib.request.urlopen(req) as response:
        for raw_line in response:
            line = raw_line.decode("utf-8").strip()
            if not line.startswith("data: "):
                continue
            
            data_str = line[6:].strip()
            if not data_str:
                continue

            try:
                event = json.loads(data_str)
                event_type = event.get("type")
                
                if event_type == "tags":
                    tags_received = event.get("data", [])
                    print(f"[EVENT: TAGS] Received {len(tags_received)} early keywords: {tags_received[:4]}...")
                elif event_type == "token":
                    token_chunks += 1
                    token = event.get("data", "")
                    if token_chunks <= 10:
                        print(f"[EVENT: TOKEN #{token_chunks}] '{token}'")
                    elif token_chunks == 11:
                        print("... [Tokens streaming live at high speed] ...")
                elif event_type == "done":
                    final_result = event.get("data", {})
                    print(f"\n[EVENT: DONE] Stream finished successfully!")
                    print(f"  -> Title: {final_result.get('title')}")
                    print(f"  -> Model: {final_result.get('model')}")
                    print(f"  -> SEO Score: {final_result.get('seo_score')} / 100")
                    print(f"  -> SEO Breakdown: {final_result.get('seo_breakdown')}")
                    print(f"  -> Tags ({len(final_result.get('tags', []))}): {final_result.get('tags')}")
                elif event_type == "error":
                    print(f"[EVENT: ERROR] {event.get('message')}")
            except Exception as e:
                print(f"[PARSE ERROR] {e}")

    return final_result

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    
    # Test 1: Groq 120B Flagship
    test_stream("groq-120b")

    # Test 2: Groq 20B Ultra-Fast
    test_stream("groq-20b")

    # Test 3: Groq Qwen 27B
    test_stream("qwen-27b")
