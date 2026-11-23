import http.server
import socketserver
import json
import urllib.request
import urllib.parse
import re
import os
import sys

PORT = 8089
# Load local .env if available
if os.path.exists(".env"):
    with open(".env") as f:
        for line in f:
            if line.strip().startswith("GROQ_API_KEY="):
                os.environ["GROQ_API_KEY"] = line.strip().split("=", 1)[1].strip()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "openai/gpt-oss-120b"

def clean_handle(val):
    if not val:
        return ""
    v = val.strip().rstrip("/")
    if "/" in v:
        v = v.split("/")[-1]
    return v.lstrip("@")

def scrape_duckduckgo(query):
    if not query:
        return ""
    try:
        url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query)
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        html = urllib.request.urlopen(req, timeout=5).read().decode("utf-8", errors="ignore")
        snippets = re.findall(r'<a class="result__snippet[^"]*"[^>]*>(.*?)</a>', html)
        clean = [re.sub(r'<[^<]+?>', '', s).strip() for s in snippets[:6]]
        return "\n".join(clean)
    except Exception as e:
        print(f"[Scraper] Search error for {query}: {e}")
        return ""

def scrape_github(username):
    user = clean_handle(username)
    if not user:
        return None
    try:
        url = f"https://api.github.com/users/{user}"
        req = urllib.request.Request(url, headers={
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Mozilla/5.0"
        })
        userData = json.loads(urllib.request.urlopen(req, timeout=5).read().decode("utf-8"))
        
        repos = []
        try:
            repoUrl = f"https://api.github.com/users/{user}/repos?sort=updated&per_page=5"
            repoReq = urllib.request.Request(repoUrl, headers={
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "Mozilla/5.0"
            })
            repoData = json.loads(urllib.request.urlopen(repoReq, timeout=5).read().decode("utf-8"))
            for r in repoData:
                repos.append({
                    "title": r.get("name", "Project"),
                    "desc": r.get("description") or "Open source software project.",
                    "url": r.get("html_url") or f"https://github.com/{user}",
                    "stars": r.get("stargazers_count", 0),
                    "lang": r.get("language") or "Code"
                })
        except Exception as e:
            print(f"[Scraper] Repo fetch error: {e}")
            
        return {
            "name": userData.get("name") or user,
            "handle": userData.get("login") or user,
            "bio": userData.get("bio") or "",
            "avatar": userData.get("avatar_url") or "",
            "location": userData.get("location") or "",
            "followers": userData.get("followers", 0),
            "repos": repos
        }
    except Exception as e:
        print(f"[Scraper] GitHub error for {user}: {e}")
        return None

def synthesize_with_groq(search_text, gh_data, user_inputs):
    handle = clean_handle(user_inputs.get("github") or user_inputs.get("twitter") or user_inputs.get("instagram") or user_inputs.get("name") or "crazy")
    display_name = user_inputs.get("name") or gh_data.get("name") if gh_data else handle

    context_prompt = f"""
You are an expert digital persona architect specializing in ultra-aesthetic, high-craft guns.lol style bios.
Synthesize the provided public data into a stunning, elite guns.lol profile JSON.

User inputs: {json.dumps(user_inputs)}
GitHub Data: {json.dumps(gh_data) if gh_data else 'None'}
Web search snippets: {search_text}

Rules:
1. handle: clean alphanumeric username (lowercase, no spaces, e.g. "{handle}")
2. displayName: aesthetic title (e.g. "/{handle}" or "{display_name}")
3. tagline: short punchy 2-4 word subtext (e.g. "dystopias.xyz" or "high-craft systems")
4. typewriterTexts: 3-4 strings for an animated typewriter loop (e.g. ["{handle}.xyz", "full-stack developer", "obsessed with craft", "listening to {user_inputs.get('song', 'lofi')}"])
5. bio: 1-2 sentence aesthetic bio without corporate fluff.
6. location: real or aesthetic location (e.g. "{gh_data.get('location') if gh_data and gh_data.get('location') else 'Europe / Grid'}")
7. timezone: timezone string (e.g. "GMT+1", "GMT-5", "GMT+5:30")
8. badges: 4-5 aesthetic badges with unicode emojis (e.g. [ {{"icon": "💎", "name": "Premium"}}, {{"icon": "❄️", "name": "Frost"}}, {{"icon": "⚡", "name": "Early"}}, {{"icon": "⭐️", "name": "Legend"}}, {{"icon": "🚀", "name": "Dev"}} ])
9. skills: 5-7 programming languages or aesthetic skills (e.g. ["TypeScript", "Rust", "Python", "CSS Art", "C++", "Shader"])
10. presence: object with {{ "platform": "Discord", "status": "Online", "game": "Playing Valorant", "avatar": "{gh_data.get('avatar') if gh_data and gh_data.get('avatar') else ''}" }}
11. projects: array of 2-3 project objects {{ "title": "Project Name", "desc": "short description", "url": "https://...", "actionText": "Visit" }}
12. song: {{ "title": "{user_inputs.get('songTitle', 'Resonance')}", "artist": "{user_inputs.get('songArtist', 'HOME')}" }}
13. views: a realistic view count number between 240 and 4200.

Return ONLY raw JSON. No markdown ticks, no preamble.
"""
    try:
        payload = json.dumps({
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": context_prompt}],
            "temperature": 0.4
        }).encode("utf-8")
        
        req = urllib.request.Request("https://api.groq.com/openai/v1/chat/completions", data=payload, headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        })
        
        res = urllib.request.urlopen(req, timeout=12)
        raw_res = json.loads(res.read().decode("utf-8"))["choices"][0]["message"]["content"]
        
        # Clean potential markdown wrapping
        clean_json = raw_res.strip()
        if clean_json.startswith("```"):
            clean_json = re.sub(r"^```[a-z]*\s*", "", clean_json)
            clean_json = re.sub(r"\s*```$", "", clean_json)
            
        parsed = json.loads(clean_json)
        # Ensure avatar fallback
        if not parsed.get("avatar"):
            parsed["avatar"] = gh_data.get("avatar") if gh_data and gh_data.get("avatar") else f"https://api.dicebear.com/7.x/bottts/svg?seed={handle}"
        return parsed
    except Exception as e:
        print(f"[Groq AI] Error synthesizing persona: {e}")
        # Robust fallback synthesis
        return {
            "handle": handle,
            "displayName": f"/{handle}",
            "tagline": f"{handle}.xyz",
            "typewriterTexts": [f"{handle}.xyz", "full-stack developer", "crafting digital systems", "music & code"],
            "bio": gh_data.get("bio") if gh_data and gh_data.get("bio") else "Building high-performance software and exploring aesthetic digital interfaces.",
            "avatar": gh_data.get("avatar") if gh_data and gh_data.get("avatar") else f"https://api.dicebear.com/7.x/bottts/svg?seed={handle}",
            "location": gh_data.get("location") if gh_data and gh_data.get("location") else "Europe / Grid",
            "timezone": "GMT+1",
            "badges": [
                {"icon": "💎", "name": "Premium"},
                {"icon": "❄️", "name": "Frost"},
                {"icon": "⚡", "name": "Early"},
                {"icon": "⭐️", "name": "Legend"},
                {"icon": "🚀", "name": "Developer"}
            ],
            "skills": ["TypeScript", "Python", "Rust", "CSS Art", "C++", "WebGL"],
            "presence": {
                "platform": "Discord",
                "status": "Online",
                "game": "Active in VS Code",
                "avatar": gh_data.get("avatar") if gh_data and gh_data.get("avatar") else f"https://api.dicebear.com/7.x/bottts/svg?seed={handle}"
            },
            "projects": gh_data.get("repos") if gh_data and gh_data.get("repos") else [
                {"title": f"{handle}-core", "desc": "High-performance reactive systems and graphics kernel.", "url": f"https://github.com/{handle}", "actionText": "Visit"},
                {"title": "dystopia-ui", "desc": "Accessible motion design tokens and CRT shaders.", "url": f"https://github.com/{handle}", "actionText": "Visit"}
            ],
            "song": {
                "title": user_inputs.get("songTitle") or "Resonance",
                "artist": user_inputs.get("songArtist") or "HOME"
            },
            "views": 1669
        }

class AppHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/scrape":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                user_inputs = json.loads(body)
            except Exception:
                user_inputs = {}

            print(f"[API] Processing scrape request for: {user_inputs}")
            
            # 1. Scrape GitHub if available
            gh_username = user_inputs.get("github") or user_inputs.get("name") or ""
            gh_data = scrape_github(gh_username)

            # 2. Scrape DuckDuckGo for public presence
            query_name = user_inputs.get("name") or gh_username or user_inputs.get("twitter") or user_inputs.get("instagram") or ""
            search_text = scrape_duckduckgo(f"{query_name} instagram twitter github developer bio")

            # 3. Synthesize with Groq LLM
            persona = synthesize_with_groq(search_text, gh_data, user_inputs)

            # 4. Form social links array
            socials = []
            if user_inputs.get("twitter") or user_inputs.get("x"):
                t = clean_handle(user_inputs.get("twitter") or user_inputs.get("x"))
                socials.append({"icon": "𝕏", "platform": "X", "url": f"https://x.com/{t}"})
            if user_inputs.get("instagram"):
                insta = clean_handle(user_inputs.get("instagram"))
                socials.append({"icon": "📷", "platform": "Instagram", "url": f"https://instagram.com/{insta}"})
            if gh_data or user_inputs.get("github"):
                gh = clean_handle(user_inputs.get("github") or (gh_data.get("handle") if gh_data else ""))
                socials.append({"icon": "🐙", "platform": "GitHub", "url": f"https://github.com/{gh}"})
            if user_inputs.get("telegram"):
                tg = clean_handle(user_inputs.get("telegram"))
                socials.append({"icon": "✈️", "platform": "Telegram", "url": f"https://t.me/{tg}"})
            if user_inputs.get("discord"):
                socials.append({"icon": "💬", "platform": "Discord", "url": "#"})
            if user_inputs.get("email"):
                socials.append({"icon": "✉️", "platform": "Email", "url": f"mailto:{user_inputs.get('email')}"})
            elif not socials:
                socials = [
                    {"icon": "𝕏", "platform": "X", "url": "https://x.com"},
                    {"icon": "✉️", "platform": "Email", "url": "mailto:swat@dystopias.xyz"},
                    {"icon": "✈️", "platform": "Telegram", "url": "https://t.me"},
                    {"icon": "🐙", "platform": "GitHub", "url": "https://github.com"}
                ]
            persona["socials"] = socials

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(persona).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), AppHandler) as httpd:
        print(f"[*] Guns.lol AI Platform Server running on http://localhost:{PORT}")
        httpd.serve_forever()
