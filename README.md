# Gen AI Video Creator

A Next.js application that automatically generates AI-powered videos by combining script generation, image creation, text-to-speech, and video editing capabilities.

## Features

- 🤖 AI-powered video script generation using Claude 3 (Anthropic)
- 🎨 Image generation for scenes using Fal.ai
- 🗣️ Text-to-speech audio generation with ElevenLabs
- 🎬 Video editing capabilities with CE.SDK
- ⚛️ Built with Next.js and TypeScript
- 💅 Styled with Tailwind CSS

## Prerequisites

- Node.js 18+ installed
- API keys for:
  - Anthropic Claude
  - Fal.ai
  - ElevenLabs
  - CE.SDK license 

## Getting Started

1. Clone the repository:
2. Install dependencies:
```sh
npm install
```
3. Set up environment variables by creating a .env.local file:
```sh
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_claude_api_key
NEXT_PUBLIC_FAL_API_KEY=your_fal_ai_key
```
4. Start the development server:
```sh
npm run dev
```
Open http://localhost:3000 in your browser

# License
This project is licensed under the MIT License.