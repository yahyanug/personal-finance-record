"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { KeyboardEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SendIcon, SparklesIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { handleWizardInput } from "@/features/ai/chat";
import { useMutation } from "@tanstack/react-query";

const formSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export default function WizardInput() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: handleWizardInput,
    onSuccess: (response) => {
      console.log(response);
      form.reset();
    },
    onError: (error) => {
      console.log(error);
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    mutate(data.message);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(form.getValues());
    }
  }

  return (
    <Card className="w-full border-primary/20 p-0 focus-within:ring-2 focus-within:ring-primary/30">
      <CardContent className="pl-4 pr-2">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex items-center gap-2"
        >
          <div className="shrink-0 text-primary">
            <SparklesIcon className="size-5" />
          </div>
          <Controller
            control={form.control}
            name="message"
            render={({ field }) => (
              <Field className="min-w-0 flex-1">
                <Input
                  {...field}
                  id="form-message"
                  placeholder="Write your transaction here"
                  autoComplete="off"
                  className="h-14 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
                  onKeyDown={handleKeyDown}
                  disabled={isPending}
                />
              </Field>
            )}
          />
          <Button type="submit" size="icon" variant="ghost">
            {isPending ? (
              <Loader2Icon className="size-5 animate-spin" />
            ) : (
              <SendIcon className="size-5"></SendIcon>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
