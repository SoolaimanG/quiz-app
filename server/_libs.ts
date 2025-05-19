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
