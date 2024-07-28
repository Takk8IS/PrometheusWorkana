// ```background.js

// Listener for extension icon click action
chrome.action.onClicked.addListener((tab) => {
    if (tab && tab.id) {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        { action: "activate" },
                        function (response) {
                            if (chrome.runtime.lastError) {
                                console.error(
                                    `Error sending message: ${chrome.runtime.lastError.message}`,
                                );
                            } else {
                                console.log("Message sent successfully");
                            }
                        },
                    );
                }
            },
        );
    } else {
        console.error("Error: invalid tab or tab ID not available.");
    }
});

// Listener for extension installation event
chrome.runtime.onInstalled.addListener((details) => {
    switch (details.reason) {
        case chrome.runtime.OnInstalledReason.INSTALL:
            console.log("PrometheusWorkana extension installed.");
            break;
        case chrome.runtime.OnInstalledReason.UPDATE:
            console.log("PrometheusWorkana extension updated.");
            break;
        case chrome.runtime.OnInstalledReason.CHROME_UPDATE:
            console.log(
                "Chrome updated, please check extension compatibility.",
            );
            break;
        default:
            console.log("Unknown installation event:", details);
            break;
    }
});
