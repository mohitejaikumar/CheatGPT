"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const app = (0, express_1.default)();
const port = 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
function generateResponse(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield model.generateContent(message);
        return response.response.text();
    });
}
// Function to generate response from an image and text prompt
function generateResponseFromImage(prompt, imageBase64, mimeType // e.g., "image/png", "image/jpeg"
) {
    return __awaiter(this, void 0, void 0, function* () {
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType,
            },
        };
        try {
            // Send the prompt and image to the model
            const result = yield model.generateContent([prompt, imagePart]);
            const response = result.response.text();
            return response;
        }
        catch (error) {
            console.error("Error generating response from image:", error);
            throw new Error("Failed to generate response from image.");
        }
    });
}
app.post("/api/v1/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { message } = req.body;
    console.log("Got the message", message.slice(0, 100));
    try {
        const response = yield generateResponse(message);
        console.log("Response", response.slice(0, 100));
        res.send({
            response: response,
        });
    }
    catch (err) {
        console.log("Error", err);
        res.send({
            message: "Error while generating response",
        });
    }
}));
// @ts-ignore
app.post("/api/v1/image-chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prompt, imageBase64, mimeType } = req.body;
    if (!prompt || !imageBase64 || !mimeType) {
        return res.status(400).send({
            message: "Missing required fields: prompt, imageBase64, mimeType",
        });
    }
    const base64Data = imageBase64.replace(/^data:image\/png;base64,/, "");
    console.log("Got image request, prompt:", prompt.slice(0, 100));
    console.log("Got image request, mimeType:", mimeType);
    console.log("Got image request, base64 length:", imageBase64.length);
    try {
        const response = yield generateResponseFromImage(prompt, base64Data, mimeType);
        console.log("Image Response", response.slice(0, 100));
        res.send({
            response: response,
        });
    }
    catch (err) {
        let errorMessage = "Error while generating response from image";
        if (err instanceof Error) {
            errorMessage = err.message;
        }
        console.log("Error processing image request:", err);
        res.status(500).send({
            message: errorMessage,
        });
    }
}));
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
