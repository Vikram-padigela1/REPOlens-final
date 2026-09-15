import os
import warnings

# Suppress deprecation warnings
warnings.filterwarnings("ignore")

import google.generativeai as genai  # noqa: E402
from dotenv import load_dotenv  # noqa: E402

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

for m in genai.list_models():
    if "embedContent" in m.supported_generation_methods:
        print(m.name)
