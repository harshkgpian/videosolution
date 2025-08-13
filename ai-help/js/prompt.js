// js/prompt.js

export const SCRIPT_PROMPT_TEMPLATE = `Your Task:
You are an expert educational content creator. Your task is to generate a detailed, engaging Hinglish voiceover script for a video solution based on the provided question and its step-by-step solution.

Strict Guidelines to Follow:
The script must strictly adhere to the following structure and rules:

1.  Language: The script must be in Hinglish (a mix of Hindi and English), making it easy for students to understand. The tone should be gentle, energetic, and encouraging.

2.  Structure: The script must be divided into four distinct parts in this specific order:
    a. Opening Line: Start with "Hello Bachhon..." and read the question.
    b. Key Concept Section: Introduce the core principles using the exact phrase "**KEY CONCEPT**".
    c. Solution Walkthrough: Explain the provided step-by-step solution.
    d. Closing Line: End with the appropriate closing statement ("The Final Answer is...").

3.  LaTeX Formatting: All mathematical formulas, variables, and equations must be written in LaTeX format (e.g., $l_1=5l_2$) for proper rendering.

---
INPUTS:

1. Question:
\`\`\`
[---PASTE THE FULL QUESTION TEXT HERE---]
\`\`\`

2. Detailed Solution:
\`\`\`
[---PASTE THE DETAILED, STEP-BY-STEP SOLUTION HERE.---]
\`\`\`
---

Please generate the complete Hinglish voiceover script now based on the inputs and guidelines above.`;