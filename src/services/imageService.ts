import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { extractNumbers } from "../lib/functions";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function uploadAndAnalyzeImage(
  pathToSaveImage: string,
  measure_type: string
): Promise<number> {
  const uploadResponse = await fileManager.uploadFile(pathToSaveImage, {
    mimeType: "image/jpeg",
    displayName: "Water Gas measure",
  });

  const result = await model.generateContent([
    {
      fileData: {
        mimeType: uploadResponse.file.mimeType,
        fileUri: uploadResponse.file.uri,
      },
    },
    {
      text: `The image you received is a ${measure_type.toLowerCase} meter, please return to me ONLY the number of the meter. The numbers are in the center of the meter`,
    },
  ]);

  return extractNumbers(result.response.text());
}
