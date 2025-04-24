import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

async function generateResponse(message: string) {
  const response = await model.generateContent(message);
  return response.response.text();
}

// Function to generate response from an image and text prompt
async function generateResponseFromImage(
  prompt: string,
  imageBase64: string,
  mimeType: string // e.g., "image/png", "image/jpeg"
): Promise<string> {
  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: mimeType,
    },
  };

  try {
    // Send the prompt and image to the model
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response.text();
    return response;
  } catch (error) {
    console.error("Error generating response from image:", error);
    throw new Error("Failed to generate response from image.");
  }
}

app.post("/api/v1/chat", async (req, res) => {
  const { message } = req.body;
  console.log("Got the message", message.slice(0, 100));
  try {
    const response = await generateResponse(message);

    console.log("Response", response.slice(0, 100));
    res.send({
      response: response,
    });
  } catch (err) {
    console.log("Error", err);
    res.send({
      message: "Error while generating response",
    });
  }
});

// @ts-ignore
app.post("/api/v1/image-chat", async (req, res) => {
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
    const response = await generateResponseFromImage(
      prompt,
      base64Data,
      mimeType
    );
    console.log("Image Response", response.slice(0, 100));
    res.send({
      response: response,
    });
  } catch (err: unknown) {
    let errorMessage = "Error while generating response from image";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    console.log("Error processing image request:", err);
    res.status(500).send({
      message: errorMessage,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
