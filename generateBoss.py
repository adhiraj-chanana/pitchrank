import base64
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(".env.local")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

base_prompt = """A caricature illustration of a skeptical venture capitalist boss.
Exaggerated features — large head, sharp judgmental eyes, slightly
oversized suit jacket, expensive watch. Cartoon/caricature art style,
clean lines, bold colors, white or very dark background.
Same character design across all 5 images, only the expression
and body language changes. Digital illustration style,
not photorealistic."""

states = [
    {
        "name": "dismissive",
        "prompt": base_prompt + " Expression: Arms crossed, rolling eyes, phone in hand scrolling, eyebrow raised in disbelief, mouth slightly frowning"
    },
    {
        "name": "interested",
        "prompt": base_prompt + " Expression: Arms still crossed but eyes now looking up, one eyebrow cocked, phone put down, neutral expression"
    },
    {
        "name": "attentive",
        "prompt": base_prompt + " Expression: Leaning forward, arms uncrossed, chin on fist, eyes focused and sharp, mouth neutral"
    },
    {
        "name": "impressed",
        "prompt": base_prompt + " Expression: Eyes wide, slight smirk, leaning forward, one hand pointing, clearly surprised"
    },
    {
        "name": "excited",
        "prompt": base_prompt + " Expression: Both hands on desk, huge grin, eyes lit up, leaning way forward, completely energized"
    },
]

os.makedirs("public/boss", exist_ok=True)

for state in states:
    print(f"Generating {state['name']}...")
    response = client.images.generate(
        model="gpt-image-1",
        prompt=state["prompt"],
        size="1024x1024",
        quality="medium",
        n=1,
    )

    image_data = response.data[0].b64_json
    image_bytes = base64.b64decode(image_data)
    with open(f"public/boss/boss-{state['name']}.png", "wb") as f:
        f.write(image_bytes)
    print(f"Saved boss-{state['name']}.png")

print("All 5 boss images generated!")