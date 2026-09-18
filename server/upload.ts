import "dotenv/config";
import type { Express, Request, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { isAuthenticated } from "./Auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const upload = multer({ storage: multer.memoryStorage() });

export function registerUploadRoutes(app: Express) {
  app.post("/api/upload", isAuthenticated, upload.single("file"), async (req: Request, res: Response) => {
    try {
      const file = (req as any).file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "developmenthr/medical", resource_type: "auto" },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(file.buffer);
      });

      return res.json({ url: result.secure_url, publicId: result.public_id });
    } catch (e: any) {
      console.error("Upload error:", e);
      return res.status(500).json({ message: "Upload failed" });
    }
  });
}
