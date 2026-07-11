from typing import Optional
from dotenv import load_dotenv
import os
import openai
import google.generativeai as genai

load_dotenv()


class LLMService:
    def __init__(self, provider: str = "openai"):
        self.provider = provider.lower()
        self._initialize_client()

    def _initialize_client(self):
        if self.provider == "openai":
            self.openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        elif self.provider == "gemini":
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            # Updated from deprecated gemini-1.0-pro to gemini-1.5-flash
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        elif self.provider == "openrouter":
            self.openrouter_client = openai.OpenAI(
                api_key=os.getenv("OPENROUTER_API_KEY"),
                base_url="https://openrouter.ai/api/v1"
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")

    def generate_response(self, prompt: str, max_tokens: int = 512, temperature: float = 0.3) -> str:
        try:
            if self.provider == "openai":
                return self._generate_openai(prompt, max_tokens, temperature)
            elif self.provider == "gemini":
                return self._generate_gemini(prompt, max_tokens, temperature)
            elif self.provider == "openrouter":
                return self._generate_openrouter(prompt, max_tokens, temperature)
        except Exception as e:
            return f"Error generating response: {str(e)}"

    def _generate_openai(self, prompt: str, max_tokens: int, temperature: float) -> str:
        response = self.openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that answers questions based on document context."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=temperature
        )
        return response.choices[0].message.content.strip()

    def _generate_gemini(self, prompt: str, max_tokens: int, temperature: float) -> str:
        response = self.gemini_model.generate_content(
            prompt,
            generation_config={
                'max_output_tokens': max_tokens,
                'temperature': temperature
            }
        )
        return response.text.strip()

    def _generate_openrouter(self, prompt: str, max_tokens: int, temperature: float) -> str:
        response = self.openrouter_client.chat.completions.create(
            model="google/gemini-2.5-flash",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that answers questions based on document context."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=temperature
        )
        return response.choices[0].message.content.strip()

    def get_provider_name(self) -> str:
        return self.provider