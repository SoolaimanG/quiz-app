"use client";

import { utils, Utils } from "@/lib/utils";
import { useQuestion } from "@/store/question.store";
import { useSession } from "@/store/session.store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { FC, Fragment, useCallback, useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { EmptyUI } from "../empty-ui";
import { Button } from "../ui/button";
import { IOption, IQuestion, IQuestionType } from "@/types/index.types";
import mongoose from "mongoose";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import {
  CircleHelp,
  Ellipsis,
  Image as ImageIcon,
  Star,
  Trash2,
} from "lucide-react";
import { Textarea } from "../ui/textarea";
import { UploadImage } from "../upload-image";
import { useEditTest } from "@/store/test.store";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { useDebounce } from "@uidotdev/usehooks";

const _questionTypes: Record<IQuestionType, string> = {
  boolean: "Boolean (Check if the question is true only)",
  "long-answer": "Long Answer (Please type in your answer is neccessary)",
  mcq: "Multiple Choice Question (Please check the all checkbox that are correct options)",
  obj: "Objective (Please check the checkbox to mark option as correct one)",
  "short-answer": "Short Answer (Please type in your answer is neccessary)",
};

export const CreateQuestionViewPort: FC<{ testId: string }> = ({ testId }) => {
  const { sessionToken } = useSession();
  const {
    setIsLoading,
    setQuestions,
    addQuestion: addNewQuestion,
    removeQuestion,
    questions: _questions,
  } = useQuestion();

  const utils = new Utils(sessionToken);

  const { isLoading, data: questions } = useQuery({
    queryKey: ["questions", testId],
    queryFn: () => utils.getTestQuestions(testId),
    enabled: !!sessionToken && !!testId,
  });

  useEffect(() => {
    setIsLoading(isLoading);

    setQuestions(questions?.data?.questions || []);
  }, [questions?.data, isLoading]);

  const addQuestion = async (type: IQuestionType = "obj") => {
    let _id = new mongoose.Types.ObjectId().toString();

    try {
      const question: IQuestion = {
        _id,
        question: "This is where you type your question.",
        score: 5,
        test: testId,
        type: "obj",
      };

      addNewQuestion(question); //Performing optimistic update first

      const defaultOptions: IOption[] = Array.from({ length: 3 }).map(
        (_, idx) => ({
          isCorrect: false,
          option: `Option ${idx}`,
          question: "",
        })
      );

      await utils.createQuestion(
        testId,
        { type: question.type, question: question.question },
        type === "obj" || type === "mcq" ? defaultOptions : undefined
      );

      console.log(question);
    } catch (error) {
      removeQuestion(_id); //Removing the question if there is an error

      const { errors, message: errMsg } = utils.structureError(error);

      const message = errors
        ?.map((error) => `${error.path[0]}: ${error.message}`)
        .join(", ");

      toast.error("Error", {
        description: !!errors?.length ? message : errMsg,
      });
    }
  };

  return (
    <div className="md:max-w-5xl mx-auto w-full p-6 md:p-0 mt-10">
      {isLoading ? (
        <div className="flex flex-col gap-3 w-full">
          {Array.from({ length: 10 })?.map((_, idx) => (
            <Skeleton key={idx} className="w-full h-96" />
          ))}
        </div>
      ) : !questions?.data?.totalQuestions ? (
        <EmptyUI
          title="No Questions"
          message="This test does not have any questions available."
          className="gap-2 mt-20"
        >
          <Button onClick={() => addQuestion()}>
            Click to start adding questions
          </Button>
        </EmptyUI>
      ) : (
        <div className="flex flex-col gap-3 w-full">
          {Array.from(_questions?.values()!)?.map((question, idx) => (
            <QuestionCreationCard key={question?._id} {...question} idx={idx} />
          ))}
        </div>
      )}
    </div>
  );
};

const QuestionCreationCard: FC<IQuestion & { idx?: number }> = ({
  ...props
}) => {
  const {
    questions,
    editQuestion,
    addOptions,
    addOption,
    removeOption,
    options: _options,
  } = useQuestion();
  const { data: test, setSaving, setLastUpdated } = useEditTest();
  const queryClient = useQueryClient();
  const [chnagingValue, setChangingValue] = useState<string>();
  const debouncedValue = useDebounce(chnagingValue, 2000);

  const questionTypes: { type: IQuestionType; label: string }[] = [
    { type: "boolean", label: "Boolean" },
    { type: "mcq", label: "Multiple Choice" },
    { type: "obj", label: "Objective" },
    { type: "short-answer", label: "Short Answer" },
    { type: "long-answer", label: "Long Answer" },
  ];
  const [answer, setAnswer] = useState<string>();
  const debouncedAnswer = useDebounce(answer, 2000);

  const question = questions?.get(props?._id!);

  const canShowSetAnswer =
    (question?.type === "short-answer" || question?.type === "long-answer") &&
    test?.settings?.allowInternalSystemToGradeTest;

  const showOptions = question?.type === "obj" || question?.type === "mcq";

  const addNewOption = async () => {
    let _id = new mongoose.Types.ObjectId().toString(); //Generating a new id for the new option to b

    try {
      const optionPayload: IOption = {
        isCorrect: false,
        option: `Option ${_options.size + 1}`,
        question: props?._id!,
      };

      addOption({
        ...optionPayload,
        _id,
      });

      setSaving(true);
      const res = await utils.createOption(test?._id!, props?._id!, [
        optionPayload,
      ]);

      setLastUpdated();
      queryClient.invalidateQueries({ queryKey: ["options", props?._id] });

      toast.success("SUCCESS", { description: res.message });
    } catch (error) {
      removeOption(_id); //Removing the option if there is an error

      const { errors, message: errMsg } = utils.structureError(error);

      const message = errors
        ?.map((error) => `${error.path[0]}: ${error.message}`)
        .join(", ");

      toast.error("Error", {
        description: !!errors?.length ? message : errMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  const modifyOption = async (
    _id: string,
    question?: string,
    score?: number,
    type?: IQuestionType
  ) => {
    try {
      setSaving(true);
      await utils.updateQuestion(test?._id!, _id, {
        question,
        score,
        type,
      });
      setLastUpdated();
    } catch (error) {
      editQuestion(_id, {
        question: "Something went wrong",
        score: 0,
      });

      const { errors, message: errMsg } = utils.structureError(error);

      const message = errors
        ?.map((error) => `${error.path[0]}: ${error.message}`)
        .join(", ");

      toast.error("Error", {
        description: !!errors?.length ? message : errMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  const modifyAnswer = async (answer = "") => {
    try {
      setSaving(true);
      await utils.createOrUpdateQuestionAnswer(test?._id!, props?._id!, answer);
      setLastUpdated();
    } catch (error) {
      setAnswer(data?.data?.answer || "");

      const { errors, message: errMsg } = utils.structureError(error);

      const message = errors
        ?.map((error) => `${error.path[0]}: ${error.message}`)
        .join(", ");

      toast.error("Error", {
        description: !!errors?.length ? message : errMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  const { isLoading, data } = useQuery({
    queryKey: ["answer", props?._id],
    queryFn: () => utils.getQuestionAnswer(test?._id!, props?._id!),
    enabled: canShowSetAnswer && !!test?._id,
  });

  useEffect(() => {
    if (data?.data?.answer) {
      setAnswer(data?.data?.answer);
    }
  }, [data?.data?.answer]);

  useEffect(() => {
    if (!debouncedAnswer) return;

    if (debouncedAnswer === data?.data?.answer) return;

    modifyAnswer(debouncedAnswer);
  }, [debouncedAnswer]);

  //Calling the update api after 2 seconds of no change in the input
  useEffect(() => {
    if (!debouncedValue) return;

    const [_id, question, score] = debouncedValue?.split("-");

    modifyOption(_id, question, Number(score));
  }, [debouncedValue]);

  return (
    <Card id={`#${question?._id}`} className="p-3 md:p-6">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between w-full">
          <Select
            value={question?.type}
            onValueChange={async (e) => {
              editQuestion(question?._id!, {
                ...question,
                type: e as IQuestionType,
              });
              setSaving(true);
              await modifyOption(
                question?._id!,
                question?.question,
                question?.score,
                e as IQuestionType
              );
              setSaving(false);
            }}
          >
            <SelectTrigger>
              <SelectValue
                defaultValue={question?.type}
                placeholder="Select Type"
              />
            </SelectTrigger>
            <SelectContent>
              {questionTypes?.map(({ type, label }) => (
                <SelectItem key={type} value={type}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              Hint?
              <Switch />
            </div>
            <Button variant="secondary" size="icon" className="size-8">
              <Ellipsis />
            </Button>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-3 p-0">
        <div className="flex items-center gap-1">
          <CircleHelp size={15} />
          <h2>Question {props.idx! + 1}</h2>
        </div>
        <div className="w-full relative group">
          <div className="w-full absolute group-hover:flex hidden items-end justify-end right-1 top-1 z-0">
            <UploadImage>
              <Button size="icon" className="size-6 z-20">
                <ImageIcon size={17} />
              </Button>
            </UploadImage>
          </div>
          <Textarea
            value={question?.question || ""}
            onChange={(e) => {
              setChangingValue(
                `${question?._id}-${e.target.value}-${question?.score}`
              );
              editQuestion(question?._id!, {
                ...question,
                question: e.target.value,
              });
            }}
            className="resize-none w-full z-10"
          />
        </div>

        {test?.settings?.allowInternalSystemToGradeTest && (
          <Fragment>
            {" "}
            <Separator />
            <h2>{_questionTypes[props.type!]}</h2>
          </Fragment>
        )}

        {showOptions && <OptionsInput questionId={props?._id!} />}

        {showOptions && <Button onClick={addNewOption}>Add Options</Button>}
      </CardContent>
      {canShowSetAnswer && <Separator />}
      <CardContent className="p-0">
        {canShowSetAnswer && (
          <div className="flex flex-col gap-2">
            <label>Answer</label>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            )}
          </div>
        )}
      </CardContent>
      {/* FOOTER */}
      <Separator />
      <CardContent className="p-0">
        <div className="flex items-center gap-1">
          <CircleHelp size={15} />
          <h2>Score</h2>
        </div>
        <div className="flex items-center gap-1 bg-muted w-fit rounded-xl p-2">
          <Input
            type="number"
            value={question?.score || 0}
            onChange={(e) => {
              if (isNaN(Number(e.target.valueAsNumber))) return;

              setChangingValue(
                `${question?._id}-${question?.question}-${e.target.valueAsNumber}`
              );
              editQuestion(question?._id!, {
                ...question,
                score: e.target.valueAsNumber || 0,
              });
            }}
            className="w-24 h-8"
          />
          <Separator orientation="vertical" />
          <h2 className="flex items-center gap-1">
            <Star size={15} />
            Score
          </h2>
        </div>
      </CardContent>
    </Card>
  );
};

const OptionsInput: FC<{ questionId: string }> = ({ ...props }) => {
  const {
    editOption,
    options,
    removeOption: _removeOption,
    addOption,
    addOptions,
  } = useQuestion();
  const { data: test, setSaving, setLastUpdated } = useEditTest();
  const [changingOption, setChangingOption] = useState<string>();
  const debouncedOptions = useDebounce(changingOption, 2000);

  const { isLoading, data: _options } = useQuery({
    queryKey: ["options", props.questionId],
    queryFn: () => utils.getQuestionOptions(test?._id!, props.questionId),
  });

  const questionOptions = useCallback(() => {
    let questionOptions: IOption[] = [];

    options.forEach((option) => {
      if (option.question === props.questionId) {
        questionOptions.push(option);
      }
    });

    return questionOptions;
  }, [options]);

  const removeOption = async (option: IOption) => {
    try {
      _removeOption(option._id!);

      setSaving(true);
      await utils.deleteOption(test?._id!, props.questionId, option._id!);
      setLastUpdated();
    } catch (error) {
      addOption(option);

      const { errors, message: errMsg } = utils.structureError(error);

      const message = errors
        ?.map((error) => `${error.path[0]}: ${error.message}`)
        .join(", ");

      toast.error("Error", {
        description: !!errors?.length ? message : errMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  const modifyOption = async (option: IOption) => {
    try {
      setSaving(true);
      const { message: description } = await utils.updateOption(
        test?._id!,
        props.questionId,
        option._id!,
        {
          option: option.option,
          isCorrect: option.isCorrect,
        }
      );

      setLastUpdated();
      toast.success("SUCCESS", { description });
    } catch (error) {
      const { errors, message: errMsg } = utils.structureError(error);

      const message = errors
        ?.map((error) => `${error.path[0]}: ${error.message}`)
        .join(", ");

      toast.error("Error", {
        description: !!errors?.length ? message : errMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!_options?.data?.length) return;

    addOptions(_options?.data);

    //Set the last updated time
    const sortedOptions = _options?.data?.sort(
      (a, b) =>
        new Date(b?.updatedAt!).getTime() - new Date(a?.updatedAt!).getTime()
    );

    if (
      test?.updatedAt &&
      new Date(test?.updatedAt).getTime() >
        new Date(sortedOptions[0]?.updatedAt!).getTime()
    ) {
      setLastUpdated(test?.updatedAt as Date);
      return;
    }

    setLastUpdated(sortedOptions[0]?.updatedAt as Date);
  }, [_options?.data]);

  useEffect(() => {
    if (!changingOption) return;

    const [optionId, value] = changingOption.split("-");

    const option = options.get(optionId);

    if (!option) return;

    modifyOption(option);
  }, [debouncedOptions]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 })?.map((_, idx) => (
          <Skeleton key={idx} className="w-full h-9" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questionOptions().map((option) => (
        <div key={option?._id} className="flex items-center gap-2">
          {test?.settings?.allowInternalSystemToGradeTest && (
            <Checkbox
              checked={option?.isCorrect}
              onCheckedChange={async (e) => {
                editOption(option._id!, { ...option, isCorrect: !!e });
                await modifyOption({ ...option, isCorrect: !!e });
              }}
              className="rounded-full size-6"
            />
          )}
          <Input
            value={option?.option || ""}
            onChange={(e) => {
              editOption(option?._id!, { ...option, option: e.target.value });
              setChangingOption(`${option?._id}-${e.target.value}`);
            }}
            className="h-9"
          />
          <Button
            onClick={() => removeOption(option)}
            size="icon"
            variant="destructive"
          >
            <Trash2 />
          </Button>
        </div>
      ))}
    </div>
  );
};
