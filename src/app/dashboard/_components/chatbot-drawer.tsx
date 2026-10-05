"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { handleChatStreaming } from "@/features/ai/chat";
import { cn } from "@/lib/utils";
import { BotIcon, ChevronDownIcon, EllipsisIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ChatbotTextArea from "./chatbot-textarea";
import { useMutation } from "@tanstack/react-query";
import Markdown from "react-markdown";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Conversation } from "@/app/types/ai";

export default function ChatbotDrawer() {
  const chatRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // const { mutate: handleChatMutation, isPending } = useMutation({
  //   mutationFn: ({
  //     isThinking,
  //   }: {
  //     isThinking: boolean;
  //   }) => handleChat(conversation, isThinking),
  //   onSuccess: (response) => {
  //     let parts: {
  //       text: string;
  //       thought?: boolean;
  //     }[] = [];

  //     if (response?.thought?.trim()) {
  //       parts = [
  //         ...parts,
  //         { thought: true, text: response?.thought || "Failure Happen" },
  //       ];
  //     }

  //     const botMessage = {
  //       role: "model",
  //       parts: [...parts, { text: response?.answer || "Failure Happen" }],
  //     };
  //     setConversation((prev) => [...prev, botMessage]);
  //   },
  //   onError: (error) => {
  //     const botMessage = {
  //       role: "model",
  //       parts: [{ text: "Failure Happen : " + error.message }],
  //     };
  //     setConversation((prev) => [...prev, botMessage]);
  //   },
  // });

  const { mutate: handleChatMutation, isPending } = useMutation({
    mutationFn: async ({ isThinking }: { isThinking: boolean }) => {
      if (isThinking) {
        setConversation((prev) => [
          ...prev,
          { role: "model", parts: [{ thought: true, text: "" }, { text: "" }] },
        ]);
        const response = await handleChatStreaming(conversation, isThinking);
        for await (const chunk of response) {
          setConversation((prev) => {
            const newConversation = [...prev];
            const lastIndex = newConversation.length - 1;

            const parts = newConversation[lastIndex].parts;

            newConversation[lastIndex] = {
              ...newConversation[lastIndex],
              parts: [
                {
                  ...parts[0],
                  text: chunk.startsWith("[thought]")
                    ? parts[0].text + chunk.replace("[thought]", "")
                    : parts[0].text,
                },
                {
                  text: !chunk.startsWith("[thought]")
                    ? parts[1].text + chunk
                    : parts[1].text,
                },
              ],
            };

            return newConversation;
          });
        }
      } else {
        setConversation((prev) => [
          ...prev,
          { role: "model", parts: [{ text: "" }] },
        ]);
        const response = await handleChatStreaming(conversation, isThinking);
        for await (const chunk of response) {
          setConversation((prev) => {
            const newConversation = [...prev];
            const lastIndex = newConversation.length - 1;

            newConversation[lastIndex] = {
              ...newConversation[lastIndex],
              parts: [
                { text: newConversation[lastIndex].parts[0].text + chunk },
              ],
            };

            return newConversation;
          });
        }
      }
    },
    onError: (error) => {
      const botMessage = {
        role: "model",
        parts: [{ text: "Failure Happen : " + error.message }],
      };
      setConversation((prev) => [...prev, botMessage]);
    },
  });

  function sendMessage(message: string) {
    if (isPending || !message.trim()) return;

    const newMessage = {
      role: "user",
      parts: [{ text: message }],
    };
    setConversation((prev) => [...prev, newMessage]);
    handleChatMutation({ isThinking });
  }

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [conversation]);

  return (
    <Drawer direction="right" modal={false}>
      <DrawerTrigger className="fixed bottom-4 right-4" asChild>
        <Button
          className="size-14 rounded-full"
          size="icon-lg"
          variant="outline"
        >
          <BotIcon className="size-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-screen! md:w-110!">
        <DrawerHeader className="flex flex-row justify-between">
          <div>
            <DrawerTitle className="text-primary font-bold">
              AI Advisor
            </DrawerTitle>
            <DrawerDescription>Get personalized advice.</DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="outline" size="icon">
              <XIcon />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="no-scrollbar overflow-y-auto px-4 h-full">
          {conversation.length > 0 ? (
            <div
              ref={chatRef}
              className="flex flex-col h-full overflow-x-hidden no-scrollbar overflow-y-auto gap-8"
            >
              {conversation.map((message, index) => (
                <div
                  key={`conversation-${index}`}
                  className={cn(
                    "flex flex-col gap-2",
                    message.role === "model" ? "items-start" : "items-end",
                  )}
                >
                  <div
                    className={cn("flex flex-col w-full", {
                      "bg-primary/20 text-primary px-5 py-2 rounded-3xl rounded-br-md w-fit max-w-3/4":
                        message.role === "user",
                    })}
                  >
                    {message.role === "model" && (
                      <div className="flex items-center text-xs gap-1 text-primary font-semibold">
                        <BotIcon />
                        AI Advisor
                      </div>
                    )}
                    {message.role === "model" ? (
                      <div className="response-ai">
                        {message.parts.map((part, indexPart) => (
                          <div key={`response-ai-${index}-${indexPart}`}>
                            {part.thought ? (
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost">
                                    show AI thinking flow
                                    <ChevronDownIcon />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="border-l pl-2 ml-4">
                                    <Markdown>{part.text}</Markdown>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            ) : (
                              <Markdown>{part.text}</Markdown>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      message.parts[0].text
                    )}
                  </div>
                </div>
              ))}
              {isPending && (
                <div className="flex items-center animate-pulse">
                  <EllipsisIcon className="size-8 text-primary/50" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <h2 className="text-3xl font-bold text-primary">Hello There</h2>
              <h4 className="text-xl">What can i help you?</h4>
            </div>
          )}
        </div>
        <DrawerFooter>
          <ChatbotTextArea
            isThinking={isThinking}
            setIsThinking={setIsThinking}
            sendMessage={sendMessage}
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
