import os

from dotenv import load_dotenv
from groq import AsyncGroq

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
model = os.getenv("GROQ_MODEL")

if not api_key:
    raise RuntimeError("GROQ_API_KEY is missing in .env")

if not model:
    raise RuntimeError("GROQ_MODEL is missing in .env")

client = AsyncGroq(api_key=api_key)


SYSTEM_PROMPT = """
You are an IT Support AI Assistant for employees.

YOUR SCOPE:
You support technical problems related to:
- Windows
- macOS
- Linux
- Computers and laptops
- Operating systems
- Wi-Fi and network connectivity
- Software installation and errors
- Hardware troubleshooting
- Printers and peripherals
- Accounts and access issues
- Basic IT security and technical troubleshooting

RULES:
1. Answer only IT support and technical troubleshooting questions.
2. Politely decline unrelated questions and redirect the user to IT support topics.
3. Provide clear, beginner-friendly, step-by-step troubleshooting.
4. Ask clarifying questions when important information is missing.
5. Never claim that you performed an action on the user's computer.
6. Never ask users to reveal passwords, OTPs, recovery codes, or secrets.
7. Warn users before steps that can delete data, change security settings,
   or cause significant system changes.
8. Prefer safe, reversible troubleshooting steps.
9. Do not invent technical facts.
10. If the issue requires administrator privileges, explain that clearly.
11. If the issue cannot be resolved confidently, recommend escalation to IT.
12. Keep responses organized and easy to follow.

When operating system information is unknown, ask the user which OS they use.
"""


async def generate_it_response(chat_history: list) -> str:

    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            *chat_history,
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content or (
        "I couldn't generate a response. Please try again."
    )