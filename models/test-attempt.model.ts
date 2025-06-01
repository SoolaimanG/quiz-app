import { IQuestionsAttempted, ITestAttempt } from "@/types/index.types";
import { Model, model, models, Schema } from "mongoose";
import { LogSchema } from "./log.model";

const QuestionsAttempted = new Schema<IQuestionsAttempted>({
  answer: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
  question: { type: Schema.Types.ObjectId, ref: "Question" },
});

const TestAttemptSchema = new Schema<ITestAttempt>(
  {
    endTime: {
      type: Date,
    },
    questionsAttempted: {
      type: [QuestionsAttempted],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
      default: new Date(),
    },
    status: {
      type: String,
      enum: ["completed", "in-progress", "not-started"],
      default: "not-started",
    },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentLogs: { type: [LogSchema], default: [] },
    teacherFeedback: { type: String },
    test: { type: Schema.Types.ObjectId, ref: "Test" },
    resultIsReady: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const TestAttempt: Model<ITestAttempt> =
  models.TestAttempt ?? model("TestAttempt", TestAttemptSchema);

export { TestAttemptSchema, TestAttempt };
