import arcjet, {
  detectBot,
  protectSignup,
  shield,
  tokenBucket,
} from "@arcjet/next";
import { createHmac, randomBytes } from "crypto";
import mongoose from "mongoose";
import { createTransport } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

//Generate a random string
export const random = (size = 128) => {
  return randomBytes(size).toString("base64");
};

//Hash a password/session with a salt
export const authentication = (password: string, salt: string) => {
  return createHmac("sha256", [salt, password].join("/"))
    .update(process.env.SECRET!)
    .digest("hex");
};

// Track the connection state
let isConnected = false;

export const connectToDatabase = async () => {
  const MONGO_DB_URI = process.env.MONGO_URI!;

  // If already connected, return the existing connection
  if (isConnected) {
    console.log("Using existing MongoDB connection");
    return;
  }

  try {
    // Set strictQuery to prepare for Mongoose 7
    mongoose.set("strictQuery", false);

    // Configure connection options
    const options = {
      bufferCommands: true, // Allow buffering commands until connection is established
      autoIndex: true, // Build indexes
      maxPoolSize: 10, // Maintain up to 10 socket connections
    };

    // Connect to MongoDB
    const connection = await mongoose.connect(MONGO_DB_URI, options);

    // Set connection flag
    isConnected = !!connection.connections[0].readyState;

    //logger.info("Connected to MongoDB");
    return connection;
  } catch (error) {
    console.log(error);
    //logger.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to database");
  }
};

export const sendEmail = async (payload: {
  emails: string[] | string;
  email: string;
  replyTo?: string;
  subject?: string;
}) => {
  let configOptions: SMTPTransport | SMTPTransport.Options | string = {
    host: "smtp-relay.brevo.com",
    port: 587,
    ignoreTLS: true,
    auth: {
      user: process.env.HOST_EMAIL,
      pass: process.env.HOST_EMAIL_PASSWORD,
    },
  };

  console.log("RAN");

  const transporter = createTransport(configOptions);
  await transporter.sendMail({
    from: "kinta@data.com",
    to: payload.emails,
    html: payload.email,
    replyTo: payload.replyTo,
    subject: payload.subject,
  });
};

export const aj = arcjet({
  key: process.env.ARCJET_KEY!, // Get your site key from https://app.arcjet.com
  characteristics: ["ip.src"], // Track requests by IP
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: "LIVE" }),
    // Create a bot detection rule
    detectBot({
      mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        // Uncomment to allow these other common bot categories
        // See the full list at https://arcjet.com/bot-list
        //"CATEGORY:MONITOR", // Uptime monitoring services
        //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
      ],
    }),
    // Create a token bucket rate limit. Other algorithms are supported.
    tokenBucket({
      mode: "LIVE",
      refillRate: 5, // Refill 5 tokens per interval
      interval: 10, // Refill every 10 seconds
      capacity: 10, // Bucket capacity of 10 tokens
    }),
    protectSignup({
      email: {
        mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
        // Block emails that are disposable, invalid, or have no MX records
        block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
      },
      bots: {
        mode: "LIVE",
        // configured with a list of bots to allow from
        // https://arcjet.com/bot-list
        allow: [], // "allow none" will block all detected bots
      },
      // It would be unusual for a form to be submitted more than 5 times in 10
      // minutes from the same IP address
      rateLimit: {
        // uses a sliding window rate limit
        mode: "LIVE",
        interval: "1m", // counts requests over a 10 minute sliding window
        max: 1, // allows 5 submissions within the window
      },
    }),
  ],
});

export function getDocumentInfo(base64Data: string) {
  // Regex specifically for document MIME types
  const documentMimePattern = /^data:(application\/[^;]+|text\/[^;]+);base64,/;
  const matches = base64Data.match(documentMimePattern);

  const sizeInBytes = (base64Data.length * 3) / 4;
  const sizeInKB = sizeInBytes / 1024;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  if (matches) {
    const mimeType = matches[1];
    const [type, subtype] = mimeType.split("/");

    // Map common document formats
    const formatMap: Record<string, any> = {
      pdf: "PDF",
      msword: "DOC",
      "vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
      "vnd.ms-excel": "XLS",
      "vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
      "vnd.ms-powerpoint": "PPT",
      "vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
      plain: "TXT",
      rtf: "RTF",
      csv: "CSV",
      json: "JSON",
      xml: "XML",
    };

    return {
      mimeType: mimeType,
      type: type,
      subtype: subtype,
      format: formatMap[subtype] || subtype.toUpperCase(),
      sizeBytes: Math.round(sizeInBytes),
      sizeKB: Math.round(sizeInKB * 100) / 100,
      sizeMB: Math.round(sizeInMB * 1000) / 1000,
      hasDataUri: true,
      isDocument: true,
    };
  }
}
