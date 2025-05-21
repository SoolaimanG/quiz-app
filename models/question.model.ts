import { IAnswer, IMedia, IOption, IQuestion } from "@/types/index.types";
import { Model, model, models, Schema } from "mongoose";
import { Test } from "./test.model";

const QuestionMedia = new Schema<IMedia>(
  {
    type: {
      type: String,
      enum: ["image"],
    },
    url: {
      type: String,
    },
  },
  { _id: false }
);

const QuestionSchema = new Schema<IQuestion>({
  explanation: {
    type: String,
  },
  hint: {
    type: String,
  },
  media: {
    type: QuestionMedia,
  },
  question: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    default: 1,
  },
  type: {
    type: String,
    enum: ["long-answer", "mcq", "obj", "short-answer", "boolean"],
    required: true,
  },
  test: {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      validator: async (v: string) => {
        const testExists = await Test.exists({ _id: v });

        return Boolean(testExists);
      },
    },
  },
  booleanAnswer: {
    type: Boolean,
    default: false,
  },
});

const QuestionOptionSchema = new Schema<IOption>({
  isCorrect: {
    type: Boolean,
    default: false,
  },
  media: { type: QuestionMedia },
  option: { type: String, required: true, min: 5 },
  question: { type: Schema.Types.ObjectId, required: true },
});

const QuestionAnswerSchema = new Schema<IAnswer>({
  answer: { type: String, required: true },
  question: { type: Schema.Types.ObjectId, required: true },
});

const Question: Model<IQuestion> =
  models.Question ?? model("Question", QuestionSchema);

const QuestionOption: Model<IOption> =
  models.QuestionOption ?? model("QuestionOption", QuestionOptionSchema);

const QuestionAnswer: Model<IAnswer> =
  models.QuestionAnswer ?? model("QuestionAnswer", QuestionAnswerSchema);

export { Question, QuestionOption, QuestionAnswer };
