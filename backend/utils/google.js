import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// ✅ Ici tu définis TOUS les scopes que tu veux utiliser
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/drive.file"  // 👈 AJOUT ICI
];

export const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
};

export const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

export const calendar = google.calendar({ version: "v3", auth: oauth2Client });

import fs from "fs";

export const uploadToDrive = async (filePath, fileName) => {
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const fileMetadata = { name: fileName };
  const media = {
    mimeType: "application/pdf",
    body: fs.createReadStream(filePath)
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id"
  });

  return file.data;
};

