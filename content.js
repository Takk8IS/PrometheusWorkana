// ```content.js

// Configuration object for the extension
const CONFIG = {
    // Delay between actions in milliseconds
    delay: 2000,
    // Minimum confidence to answer a question
    confidenceThreshold: 0.7,
    // Server URL to fetch the answer
    serverUrl: "http://localhost:8004/prometheusWorkana",
};

// Function to fetch the answer from the server
async function prometheusWorkana(question, options, topic) {
    try {
        console.log("Sending question to server:", question);
        console.log("Options:", options);
        console.log("Topic:", topic);
        const response = await fetch(CONFIG.serverUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, options, topic }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Received answer from server:", data.answer);
        return data.answer;
    } catch (error) {
        console.error("Error fetching answer:", error.message);
        return null;
    }
}

// Function to select the correct answer
function selectAnswer(answerText) {
    const options = document.querySelectorAll(".radio label");
    for (let option of options) {
        if (option.textContent.trim() === answerText) {
            option.previousElementSibling.checked = true;
            return true;
        }
    }
    return false;
}

// Function to process each question
async function processQuestion() {
    const topicElement = document.querySelector("h1");
    const topic = topicElement ? topicElement.textContent.trim() : "Unknown";

    const questionContainer = document.querySelector(
        ".question-container .question-body",
    );
    if (!questionContainer) return;

    const questionText = questionContainer.textContent.trim();
    console.log("Topic:", topic);
    console.log("Question text:", questionText);

    const options = Array.from(document.querySelectorAll(".radio label")).map(
        (label) => label.textContent.trim(),
    );
    console.log("Options:", options);

    const answerText = await prometheusWorkana(questionText, options, topic);
    if (answerText && Math.random() > 1 - CONFIG.confidenceThreshold) {
        console.log("Answer text:", answerText);
        if (selectAnswer(answerText)) {
            await sleep(CONFIG.delay);
            const nextButton =
                document.querySelector("#next a") ||
                document.querySelector("#finish a");
            if (nextButton) {
                nextButton.click();
            }
        } else {
            console.log("Failed to select answer. Skipping question.");
        }
    } else {
        console.log("Low confidence or no answer. Skipping question.");
    }
}

// Utility function to sleep for a specified time
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to initialise the extension
async function initializeExtension() {
    console.log("PrometheusWorkana extension initialized");
    while (true) {
        await processQuestion();
        await sleep(CONFIG.delay);
    }
}

// Listener for extension activation message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "activate") {
        initializeExtension();
        // Send a response back
        sendResponse({ status: "Extension activated" });
    }
    // Indicates that the response is sent asynchronously
    return true;
});

// Observe DOM changes and process questions accordingly
const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.type === "childList") {
            processQuestion();
            break;
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
});
