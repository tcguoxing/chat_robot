import { createAgent, tool } from "langchain";
import * as z from "zod";
import dotenv from "dotenv";

dotenv.config();

const getWeather = tool(
  (input) => `现在${input.city}是雨季!`,
  {
    name: "get_weather",
    description: "Get the weather for a given city",
    schema: z.object({
      city: z.string().describe("The city to get the weather for"),
    }),
  }
);

const agent = createAgent({
  model: "claude-sonnet-4-6",
  // model: "claude-3-7-sonnet-20250219",
  tools: [getWeather],
});

console.log(
  await agent.invoke({
    messages: [{ role: "user", content: "What's the weather in Tokyo?" }],
  })
);


// import { createAgent, openAIModerationMiddleware } from "langchain";

// const agent = createAgent({
//   model: "openai:gpt-4.1",
//   tools: [searchTool, databaseTool],
//   middleware: [
//     openAIModerationMiddleware({
//       model: "openai:gpt-4.1",
//       moderationModel: "omni-moderation-latest",
//       checkInput: true,
//       checkOutput: true,
//       exitBehavior: "end",
//     }),
//   ],
// });


// import { ChatDeepSeek } from "@langchain/deepseek";
// import { HumanMessage } from "@langchain/core/messages";

// const model = new ChatDeepSeek({
//   apiKey: process.env.DEEPSEEK_API_KEY, // Default value.
//   model: "DeepSeek-V3.2",
// });

// const res = await model.invoke([
//   {
//     role: "user",
//     content: message,
//   },
// ]);

// const llm = new ChatDeepSeek({
//   model: "deepseek-chat",
//   temperature: 0,
//   // other params...
// })

// const aiMsg = await llm.invoke([
//   [
//     "system",
//     "请给我北京最近一周的天气",
//   ],
//   ["user", "Nice to meet you!"],
// ])
// console.log(aiMsg)

// console.log(aiMsg.content)