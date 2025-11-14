// ──────────────────────────────────────────────
// INCONNU MAIN BOT CONTROLLER
// ──────────────────────────────────────────────

// IMPORTS
const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const path = require("path");

// GITHUB CONNECTION
const octokit = new Octokit({
    auth: process.env.GH_TOKEN
});

const owner = "newwrld-dev";
const repo = "mini-data";

// LOCAL FILE PATHS
const NUMBERS_FILE = "./numbers.json";
const AKUMA_FILE = "./Popkid.json";
const SETTINGS_FILE = "./popkids.json";

// JSON HELPERS
function loadJSON(filePath) {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath));
}

function saveJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// OTP SYSTEM
const otpStore = new Map();

function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function createOTPForUser(number) {
    const code = generateOTP();
    otpStore.set(number, {
        code,
        expires: Date.now() + 5 * 60 * 1000
    });
    return code;
}

function validateOTP(number, code) {
    const info = otpStore.get(number);
    if (!info) return false;
    if (Date.now() > info.expires) return false;
    return info.code === code;
}

// SOCKET MANAGEMENT
const activeSockets = new Map();
const socketCreationTime = new Map();

function addSocket(id, socket) {
    activeSockets.set(id, socket);
    socketCreationTime.set(id, Date.now());
}

function removeSocket(id) {
    activeSockets.delete(id);
    socketCreationTime.delete(id);
}

function cleanOldSockets() {
    const now = Date.now();
    for (const [id, created] of socketCreationTime.entries()) {
        if (now - created > 60 * 60 * 1000) {
            removeSocket(id);
        }
    }
}

// GITHUB SYNC FUNCTIONS
async function uploadToGitHub(localFile, gitPath) {
    const content = fs.readFileSync(localFile, "utf8");
    const base64 = Buffer.from(content).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: gitPath,
        message: `Update ${gitPath}`,
        content: base64
    });
}

async function fetchFromGitHub(gitPath) {
    const file = await octokit.repos.getContent({
        owner,
        repo,
        path: gitPath
    });

    return Buffer.from(file.data.content, "base64").toString("utf8");
}

// EXPORT MAIN FUNCTIONS
module.exports = {
    loadJSON,
    saveJSON,
    createOTPForUser,
    validateOTP,
    addSocket,
    removeSocket,
    cleanOldSockets,
    uploadToGitHub,
    fetchFromGitHub
};
