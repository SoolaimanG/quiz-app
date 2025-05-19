import { ILogs, ILogSeverity } from "@/types/index.types";
import { Model, model, models, Schema } from "mongoose";

const LogSchema = new Schema<ILogs>(
  {
    action: {
      type: String,
    },
    log: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ["info", "error", "critical", "warning"] as ILogSeverity[],
      default: "info",
    },
    user: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Log: Model<ILogs> = models.Log ?? model("Log", LogSchema);
