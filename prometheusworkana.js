// ```prometheusworkana.js

// Disable deprecation warnings
// process.noDeprecation = true;

// Import the required libraries
import express from "express";
import bodyParser from "body-parser";
import { Groq } from "groq-sdk";
import cors from "cors";
import NodeCache from "node-cache";

// Create an Express application
const app = express();
const port = 8004;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Initialise GROQ with API key
const groq = new Groq({
    apiKey: "YOUR_GROQ_API_KEY_HERE",
});

// Cache setup (1 hour TTL)
const cache = new NodeCache({ stdTTL: 3600 });

// Utility function for sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility function for retry with exponential backoff
async function retryWithExponentialBackoff(func, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await func();
        } catch (error) {
            if (error.status !== 429 || i === maxRetries - 1) throw error;
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            console.log(
                `\nThe flames of wisdom are throttled. Rekindling in ${delay}ms...`,
            );
            await sleep(delay);
        }
    }
}

// Endpoint to handle answer requests
app.post("/prometheusWorkana", async (req, res) => {
    const { question, options, topic } = req.body;
    const cacheKey = `${topic}:${question}`;

    try {
        console.log("\nReceived from Workana...\n");
        console.log("Topic:", topic);
        console.log("Question:", question);
        console.log("Options:", options);

        // Check cache first
        const cachedAnswer = cache.get(cacheKey);
        if (cachedAnswer) {
            console.log("\nCached answer:", cachedAnswer);
            return res.json({ answer: cachedAnswer });
        }

        const prompt = `
Your Axiom: All languages, cultures, technologies, studies, concepts, practices, philosophy, design, art, culture, internet, development and programming, finance, politics, and economics are all areas of your expertise.

Your Purpose: As the mythical Prometheus, the master of ${topic}, you shall answer my question.

My Question: ${question}

Your Options:
${options.map((opt, index) => `${index + 1}. ${opt}`).join("\n")}

Your Task: Choose the option that answers my question to reveal your wisdom. Illuminate your choice with only the number, sans any additional description.`;

        console.log(
            "\nPrometheus stokes the flames of knowledge via GROQ API:",
        );
        console.log(prompt);

        const response = await retryWithExponentialBackoff(async () => {
            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama3-70b-8192",
                temperature: 0.2,
                max_tokens: 1024,
                top_p: 0.5,
                // presence_penalty: 0.0,
                // frequency_penalty: 0.5,
                stream: false,
                stop: null,
            });
            return chatCompletion.choices[0].message.content.trim();
        });

        console.log(
            "\nPrometheus' gift of wisdom bestowed through GROQ API:",
            response,
        );

        // Validate the response
        const answerIndex = parseInt(response) - 1;
        if (
            isNaN(answerIndex) ||
            answerIndex < 0 ||
            answerIndex >= options.length
        ) {
            throw new Error(
                "\nPrometheus' flame flickers: GROQ API's oracle speaks in riddles...",
            );
        }

        const answer = options[answerIndex];

        // Cache the result
        cache.set(cacheKey, answer);

        res.json({ answer });
    } catch (error) {
        console.error(
            "\nPrometheus' torch falters. Knowledge creation thwarted:",
            error,
        );
        res.status(500).json({
            error: "\nPrometheus' quest for enlightenment falls short",
        });
    }
});

// Start the server and print the banner
app.listen(port, () => {
    const banner = `
    ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
    ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
    ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
    ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
    ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
                ██╗    ██╗ ██████╗ ██████╗ ██╗  ██╗ █████╗ ███╗   ██╗ █████╗
                ██║    ██║██╔═══██╗██╔══██╗██║ ██╔╝██╔══██╗████╗  ██║██╔══██╗
                ██║ █╗ ██║██║   ██║██████╔╝█████╔╝ ███████║██╔██╗ ██║███████║
                ██║███╗██║██║   ██║██╔══██╗██╔═██╗ ██╔══██║██║╚██╗██║██╔══██║
                ╚███╔███╔╝╚██████╔╝██║  ██║██║  ██╗██║  ██║██║ ╚████║██║  ██║
                ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
    `;
    console.log(banner);
    console.log(
        `Prometheus is delivering the knowledge of Workana at http://localhost:${port}`,
    );
    console.log(
        "\nAwaiting the spark of enlightenment...\nPrometheus' torch of knowledge will ignite once extension activation is complete.",
    );
});
